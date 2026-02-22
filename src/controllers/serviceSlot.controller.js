const prisma = require('../prisma/client');

// GET /api/activos
exports.getAllServiceSlots = async (req, res) => {
  try {
    const slots = await prisma.serviceSlot.findMany({
      include: {
        empleado: true
      }
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener activos' });
  }
};

// POST /api/activos
exports.createServiceSlot = async (req, res) => {
  const { imei, telefono, ...data } = req.body;
  
  try {
    // Validaciones de unicidad manuales si es necesario, pero Prisma lo maneja con @unique
    // Sin embargo, para un mensaje más amigable:
    if (imei) {
      const existingImei = await prisma.serviceSlot.findUnique({ where: { imei } });
      if (existingImei) return res.status(400).json({ error: 'El IMEI ya existe' });
    }
    if (telefono) {
      const existingTel = await prisma.serviceSlot.findUnique({ where: { telefono } });
      if (existingTel) return res.status(400).json({ error: 'El teléfono ya existe' });
    }

    const newSlot = await prisma.serviceSlot.create({
      data: {
        imei,
        telefono,
        ...data
      }
    });
    res.status(201).json(newSlot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el activo' });
  }
};

// PUT /api/activos/:id
exports.updateServiceSlot = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedSlot = await prisma.serviceSlot.update({
      where: { id },
      data
    });
    res.json(updatedSlot);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el activo' });
  }
};

// DELETE /api/activos/:id
exports.deleteServiceSlot = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.serviceSlot.delete({
      where: { id }
    });
    res.json({ message: 'Activo eliminado correctamente' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Activo no encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el activo' });
  }
};
