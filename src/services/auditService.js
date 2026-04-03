/**
 * Servicio centralizado para auditoría y trazabilidad
 */

/**
 * Registra los cambios realizados en un ServiceSlot.
 * Se espera que esta función se ejecute dentro de una transacción de Prisma.
 *
 * @param {object} tx - Cliente transaccional de Prisma (prisma.$transaction)
 * @param {string} slotId - ID del slot modificado
 * @param {string} userId - Usuario responsable del cambio (temporalmente string)
 * @param {object} currentSlot - Estado del slot antes del cambio
 * @param {object} newData - Nuevos datos asignados al slot
 * @returns {Promise<number>} - Número de logs creados
 */
const recordChange = async (tx, slotId, userId, currentSlot, newData) => {
  const auditLogsToCreate = [];

  // Definir campos a auditar
  const auditableFields = [
    'employee_id',
    'empleado_id',
    'telefono',
    'imei',
    'modelo',
    'gama',
    'sim',
    'estatus',
    'costo_compra',
    'fecha_inicio',
    'fecha_renovacion',
  ];

  for (const key of auditableFields) {
    if (newData[key] !== undefined) {
      // Normalizar valores para comparación (ej. null vs undefined vs empty string)
      const currentVal = currentSlot[key] ?? null;
      const newVal = newData[key] ?? null;

      // Solo registrar si hay un cambio real
      if (String(currentVal) !== String(newVal)) {
        let action = 'UPDATE';
        
        // Si el campo es employee_id, podemos considerarlo una reasignación
        if (key === 'employee_id' || key === 'empleado_id') {
          action = 'REASSIGN';
        }

        auditLogsToCreate.push({
          slot_id: slotId,
          accion: action,
          campo_afectado: key,
          valor_anterior: currentVal !== null ? String(currentVal) : 'N/A',
          valor_nuevo: newVal !== null ? String(newVal) : 'N/A',
          usuario_responsable: userId || 'Sistema',
        });
      }
    }
  }

  // Si hay cambios, insertarlos usando la transacción
  if (auditLogsToCreate.length > 0) {
    await tx.auditLog.createMany({
      data: auditLogsToCreate,
    });
  }

  return auditLogsToCreate.length;
};

module.exports = {
  recordChange,
};
