const prisma = require('../prisma/client');
const { z } = require('zod');
const auditService = require('../services/auditService');

// Esquema de Validación (Zod): updateSlotSchema con partial()
const updateSlotSchema = z.object({
  modelo: z.string(),
  imei: z.string(),
  estatus: z.string(),
  centro_costos: z.string(),
  sim: z.string(),
  employee_id: z.string(),
}).partial();

// GET /api/slots
exports.getAllServiceSlots = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { tienda, distrito, gama, search, estatus, modelo, empleado, puesto } = req.query;

    let whereClause = {};

    if (gama) whereClause.gama = gama;
    if (estatus) whereClause.estatus = estatus;
    if (modelo) whereClause.modelo = { contains: modelo };
    
    if (search) {
      whereClause.OR = [
        { telefono: { contains: search } },
        { imei: { contains: search } },
      ];
    }
    
    // Filtros relaciones de empleado (incluye el nuevo campo Puesto)
    if (tienda || distrito || empleado || puesto) {
      whereClause.empleado = {};
      
      if (tienda) whereClause.empleado.tienda = { contains: tienda };
      if (distrito) whereClause.empleado.distrito = { contains: distrito };
      if (puesto) whereClause.empleado.puesto = { contains: puesto };
      
      if (empleado) {
        whereClause.empleado.OR = [
          { nombre_completo: { contains: empleado } },
          { numero_empleado: { contains: empleado } }
        ];
      }
    }

    const [slots, total] = await Promise.all([
      prisma.serviceSlot.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          empleado: true
        },
        orderBy: {
          updated_at: 'desc'
        }
      }),
      prisma.serviceSlot.count({ where: whereClause })
    ]);

    res.json({
      data: slots,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/slots/:id
exports.patchServiceSlot = async (req, res, next) => {
  const { id } = req.params;

  // Validación Zod manual para responder con 400 si falla
  const validationResult = updateSlotSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación (Zod)',
      details: validationResult.error.errors
    });
  }

  const validatedData = validationResult.data;

  try {
    const usuarioResponsable = 'Sistema'; // Aquí normalmente usaríamos req.user

    // 1. Obtener estado actual del activo (oldData) incluyendo el empleado
    const oldData = await prisma.serviceSlot.findUnique({
      where: { id },
      include: { empleado: true }
    });

    // 2. Respuesta 404 si el ID no existe
    if (!oldData) {
      return res.status(404).json({
        success: false,
        message: 'ServiceSlot no encontrado'
      });
    }

    // 3. Transacción Atómica
    const result = await prisma.$transaction(async (tx) => {
      const auditLogsToCreate = [];

      // Extraer centro_costos, que es propiedad de Employee, no de ServiceSlot
      const { centro_costos, ...slotData } = validatedData;
      const fieldsToCompare = Object.keys(validatedData);

      // 4. Lógica de Auditoría: Comparar campo por campo
      for (const field of fieldsToCompare) {
        let oldValue = oldData[field];
        let newValue = validatedData[field];

        // Manejo especial de centro_costos
        if (field === 'centro_costos') {
          oldValue = oldData.empleado ? oldData.empleado.centro_costos : null;
        }

        // Normalizar valores para comparar (evitar false positives con null vs undefined)
        const strOld = oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
        const strNew = newValue !== null && newValue !== undefined ? String(newValue) : '';

        // Si hay un cambio, preparar la entrada para la tabla AuditLog
        if (strOld !== strNew) {
          auditLogsToCreate.push({
            slot_id: id,
            accion: field === 'employee_id' ? 'REASSIGN' : 'UPDATE',
            campo_afectado: field,
            valor_anterior: strOld || 'N/A',
            valor_nuevo: strNew || 'N/A',
            usuario_responsable: usuarioResponsable
          });
        }
      }

      // Ejecutar la actualización del ServiceSlot (activo)
      const updatedSlot = await tx.serviceSlot.update({
        where: { id },
        data: slotData,
        include: { empleado: true }
      });

      // Si se proporcionó centro_costos y hay un empleado asociado, actualizar su registro
      if (centro_costos !== undefined && updatedSlot.employee_id) {
        await tx.employee.update({
          where: { numero_empleado: updatedSlot.employee_id },
          data: { centro_costos }
        });
        // Reflejar la actualización en la respuesta del slot
        updatedSlot.empleado.centro_costos = centro_costos;
      }

      // Guardar todos los registros de auditoría al mismo tiempo
      if (auditLogsToCreate.length > 0) {
        await tx.auditLog.createMany({
          data: auditLogsToCreate
        });
      }

      return updatedSlot;
    });

    // 5. Respuesta 200 con el objeto actualizado si todo es correcto
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Activo actualizado con éxito'
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/slots
exports.createServiceSlot = async (req, res, next) => {
  const { imei, telefono, ...data } = req.body;
  try {
    const newSlot = await prisma.serviceSlot.create({
      data: { imei, telefono, ...data }
    });
    res.status(201).json(newSlot);
  } catch (error) {
    next(error);
  }
};

// PUT /api/slots/:id
exports.updateServiceSlot = async (req, res, next) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const updatedSlot = await prisma.serviceSlot.update({
      where: { id },
      data
    });
    res.json(updatedSlot);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/slots/:id
exports.deleteServiceSlot = async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.serviceSlot.delete({ where: { id } });
    res.json({ message: 'Activo eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalSlots = await prisma.serviceSlot.count();

    const activeAvailableSlots = await prisma.serviceSlot.count({
      where: {
        estatus: {
          in: ['ACTIVO', 'DISPONIBLE']
        }
      }
    });

    const sumCostResult = await prisma.serviceSlot.aggregate({
      _sum: {
        costo_compra: true
      }
    });
    const totalCostoCompra = sumCostResult._sum.costo_compra || 0;

    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const renovacionProxima = await prisma.serviceSlot.count({
      where: {
        fecha_renovacion: {
          lt: ninetyDaysFromNow
        }
      }
    });

    // Grupos por gama para la gráfica
    const gamaDistribution = await prisma.serviceSlot.groupBy({
      by: ['gama'],
      _count: {
        _all: true
      }
    });

    const formatedGama = gamaDistribution.map(item => ({
      gama: item.gama || 'SIN GAMA',
      count: item._count._all
    }));

    res.json({
      success: true,
      data: {
        totalSlots,
        activeAvailableSlots,
        totalCostoCompra,
        renovacionProxima,
        gamaDistribution: formatedGama
      }
    });
  } catch (error) {
    next(error);
  }
};
