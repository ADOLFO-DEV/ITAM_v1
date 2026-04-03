const prisma = require('../prisma/client');
const { z } = require('zod');
const auditService = require('../services/auditService');

// Validation schema for PATCH
const updateSlotSchema = z.object({
  modelo: z.string().optional(),
  gama: z.string().optional(),
  empleado_id: z.string().optional(), // In the schema, it's actually `employee_id`, I'll map this or use employee_id
  employee_id: z.string().optional(),
  estatus: z.string().optional(),
});

// GET /api/slots
exports.getAllServiceSlots = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { tienda, distrito, gama, search, estatus, modelo, empleado } = req.query;

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
    
    // Employee relations for filters (tienda, distrito, empleado)
    if (tienda || distrito || empleado) {
      whereClause.empleado = {};
      if (tienda) whereClause.empleado.tienda = { contains: tienda };
      if (distrito) whereClause.empleado.distrito = { contains: distrito };
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

  try {
    const validatedData = updateSlotSchema.parse(req.body);
    
    // Identify who is making the change, currently hardcoded. In a real app, it would be req.user
    const usuarioResponsable = 'Sistema';

    // Fetch the existing slot to compare values
    const currentSlot = await prisma.serviceSlot.findUnique({
      where: { id }
    });

    if (!currentSlot) {
      return res.status(404).json({ success: false, message: 'ServiceSlot not found' });
    }

    // Execute in a transaction: update the slot and create audit logs
    const result = await prisma.$transaction(async (tx) => {
      // Registrar cambios en logs usando el nuevo auditService
      const changesCount = await auditService.recordChange(
        tx,
        id,
        usuarioResponsable,
        currentSlot,
        validatedData
      );

      const updated = await tx.serviceSlot.update({
        where: { id },
        data: validatedData,
        include: { empleado: true }
      });

      // Retornar información adicional si hubo cambios
      updated._logsCreated = changesCount;
      return updated;
    });

    res.json({
      success: true,
      data: result,
      message: result._logsCreated > 0 ? 'Slot updated and logged successfully' : 'No changes were made to log'
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
