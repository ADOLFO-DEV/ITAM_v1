const prisma = require('../prisma/client');

// GET /api/slots/:id/logs
exports.getSlotLogs = async (req, res, next) => {
  const { id } = req.params;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { slot_id: id },
      orderBy: { fecha: 'desc' },
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/logs
exports.getGlobalLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        slot: {
          select: {
            telefono: true,
            imei: true,
            empleado: {
              select: {
                nombre_completo: true,
                numero_empleado: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
