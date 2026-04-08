const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.systemUser.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;
    const requestUserId = req.user.id;

    if (!rol || !['VIEWER', 'ADMIN', 'SUPERADMIN'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (id === requestUserId) {
      return res.status(403).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const updatedUser = await prisma.systemUser.update({
      where: { id },
      data: { rol },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    if (error.code === 'P2025') {
       return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestUserId = req.user.id;

    if (id === requestUserId) {
      return res.status(403).json({ error: 'Operación denegada. No puedes eliminarte a ti mismo' });
    }

    await prisma.systemUser.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
       return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
};
