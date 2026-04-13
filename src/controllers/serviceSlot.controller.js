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
  telefono: z.string().length(10, 'El teléfono debe tener exactamente 10 dígitos'),
  fecha_inicio: z.union([z.date(), z.string().datetime()]).optional(),
  fecha_renovacion: z.coerce.date().optional(),
  correo: z.string().email('El correo debe tener un formato válido').optional().or(z.literal('')),
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

      // Extraer centro_costos y correo, que son propiedades de Employee, no de ServiceSlot
      const { centro_costos, correo, ...slotData } = validatedData;

      // Asegurarse de que las fechas sean objetos Date para evitar problemas en Prisma
      if (slotData.fecha_inicio) slotData.fecha_inicio = new Date(slotData.fecha_inicio);
      if (slotData.fecha_renovacion) slotData.fecha_renovacion = new Date(slotData.fecha_renovacion);

      // Lógica de unicidad de teléfono
      if (slotData.telefono && slotData.telefono !== oldData.telefono) {
        const duplicateSlot = await tx.serviceSlot.findFirst({
          where: {
            telefono: slotData.telefono,
            estatus: { in: ['ACTIVO', 'DISPONIBLE'] },
            id: { not: id }
          }
        });
        
        if (duplicateSlot) {
          const error = new Error('El número telefónico ya está asignado a otro activo');
          error.status = 409;
          throw error;
        }
      }

      const fieldsToCompare = Object.keys(validatedData);

      // 4. Lógica de Auditoría: Comparar campo por campo
      for (const field of fieldsToCompare) {
        let oldValue = oldData[field];
        let newValue = validatedData[field];

        // Manejo especial de centro_costos y correo
        if (field === 'centro_costos') {
          oldValue = oldData.empleado ? oldData.empleado.centro_costos : null;
        } else if (field === 'correo') {
          oldValue = oldData.empleado ? oldData.empleado.email : null;
        }

        // Normalizar valores para comparar (evitar false positives con null vs undefined)
        const strOld = oldValue !== null && oldValue !== undefined ? (oldValue instanceof Date ? oldValue.toISOString() : String(oldValue)) : '';
        const strNew = newValue !== null && newValue !== undefined ? (newValue instanceof Date ? newValue.toISOString() : String(newValue)) : '';

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

      // Si se proporcionó centro_costos o correo y hay un empleado asociado, actualizar su registro
      if ((centro_costos !== undefined || correo !== undefined) && updatedSlot.employee_id) {
        const employeeUpdateData = {};
        if (centro_costos !== undefined) employeeUpdateData.centro_costos = centro_costos;
        if (correo !== undefined && correo !== '') employeeUpdateData.email = correo;

        if (Object.keys(employeeUpdateData).length > 0) {
          await tx.employee.update({
            where: { numero_empleado: updatedSlot.employee_id },
            data: employeeUpdateData
          });
        }
        // Reflejar la actualización en la respuesta del slot
        if (centro_costos !== undefined) updatedSlot.empleado.centro_costos = centro_costos;
        if (correo !== undefined && correo !== '') updatedSlot.empleado.email = correo;
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
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// POST /api/slots
exports.createServiceSlot = async (req, res, next) => {
  // Destructurar campos que pertenecen a ServiceSlot y apartar los de Employee
  const { centro_costos, correo, ...slotData } = req.body;
  
  try {
    // Normalizar fechas de string a Date si existen, de lo contrario anular localmente para evitar error "" en Prisma
    if (slotData.fecha_inicio) {
      slotData.fecha_inicio = new Date(slotData.fecha_inicio);
    } else {
      slotData.fecha_inicio = null;
    }

    if (slotData.fecha_renovacion) {
      slotData.fecha_renovacion = new Date(slotData.fecha_renovacion);
    } else {
      slotData.fecha_renovacion = null;
    }

    // Limpiar explícitamente cadenas vacías que podrían causar conflictos
    if (slotData.imei === '') slotData.imei = null;
    if (slotData.employee_id === '') slotData.employee_id = null;

    // 1. Crear el slot principal
    const newSlot = await prisma.serviceSlot.create({
      data: slotData
    });

    // 2. Si se asignó a un empleado y trajeron centro_costos o correo, actualizamos el Empleado
    if (newSlot.employee_id && (centro_costos !== undefined || correo !== undefined)) {
      const employeeUpdateData = {};
      if (centro_costos !== undefined) employeeUpdateData.centro_costos = centro_costos;
      if (correo !== undefined && correo !== '') employeeUpdateData.email = correo;

      if (Object.keys(employeeUpdateData).length > 0) {
        await prisma.employee.update({
          where: { numero_empleado: newSlot.employee_id },
          data: employeeUpdateData
        });
      }
    }

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

    // --- NUEVO: Distribución por Distrito ---
    const slotsWithEmployee = await prisma.serviceSlot.findMany({
      where: { estatus: { in: ['ACTIVO', 'DISPONIBLE'] } },
      include: { empleado: { select: { distrito: true } } }
    });

    const districtMap = {};
    for (const slot of slotsWithEmployee) {
      if (slot.empleado) {
        const distrito = slot.empleado.distrito?.trim() || 'SIN DISTRITO';
        districtMap[distrito] = (districtMap[distrito] || 0) + 1;
      } else {
        districtMap['SIN ASIGNAR'] = (districtMap['SIN ASIGNAR'] || 0) + 1;
      }
    }
    
    // Sort districts by count descending
    const formatedDistrito = Object.keys(districtMap)
      .map(d => ({ distrito: d, count: districtMap[d] }))
      .sort((a, b) => b.count - a.count);

    // --- NUEVO: Renovaciones Mensuales (1 a 18 meses en el futuro) ---
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 1); // Empezar en el mes siguiente
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 18); // 18 Meses de ventana
    endDate.setDate(0); // Último día del mes 18
    endDate.setHours(23, 59, 59, 999);

    const slotsToRenew = await prisma.serviceSlot.findMany({
      where: {
        fecha_renovacion: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { fecha_renovacion: true }
    });

    const renovacionesMap = {};
    for (const slot of slotsToRenew) {
      if (!slot.fecha_renovacion) continue;
      const monthStr = slot.fecha_renovacion.toISOString().substring(0, 7); // Formato "YYYY-MM"
      renovacionesMap[monthStr] = (renovacionesMap[monthStr] || 0) + 1;
    }

    // Crear arreglo garantizando que cada mes del rango este representado (incluso si está en 0)
    const formatedRenovaciones = [];
    let currentMonthDate = new Date(startDate);
    
    // Helper to format Spanish month
    const formatter = new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' });
    
    for (let i = 0; i < 18; i++) {
      const key = currentMonthDate.toISOString().substring(0, 7);
      
      // We capitalize the month explicitly Ex: "Abr 2026"
      const labelData = formatter.format(currentMonthDate);
      const label = labelData.charAt(0).toUpperCase() + labelData.slice(1);

      formatedRenovaciones.push({
        mesKey: key,
        mesLabel: label,
        count: renovacionesMap[key] || 0
      });
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    }

    res.json({
      success: true,
      data: {
        totalSlots,
        activeAvailableSlots,
        totalCostoCompra,
        renovacionProxima,
        gamaDistribution: formatedGama,
        distritoDistribution: formatedDistrito,
        renovacionesMensuales: formatedRenovaciones
      }
    });
  } catch (error) {
    next(error);
  }
};
