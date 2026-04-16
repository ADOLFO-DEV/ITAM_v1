const prisma = require("../prisma/client");
const xlsx = require("xlsx");
const { z } = require("zod");

// Helpers for dates
const excelDateToJSDate = (serial) => {
  if (!serial) return null;
  // If it's already a JS Date object
  if (serial instanceof Date) return serial;
  // If it's a number (Excel serial date)
  if (typeof serial === "number") {
    // Excel date bug: considers 1900 as leap year.
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), date_info.getHours(), date_info.getMinutes(), date_info.getSeconds());
  }
  // If it's string format (e.g., '2023-01-01')
  if (typeof serial === 'string') {
    const parsed = new Date(serial);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Zod Schema to validate and clean incoming row
const AdendumSchema = z.object({
  telefono: z.union([z.string(), z.number()]).transform(s => String(s).replace(/\D/g, "")).refine(s => s.length > 0, "Teléfono es requerido"),
  region: z.union([z.string(), z.number()]).transform(s => String(s).trim()).optional().nullable(),
  cuenta: z.number().or(z.string()).transform(v => (v ? BigInt(v) : null)).optional().nullable(),
  razon_social: z.union([z.string(), z.number()]).transform(s => String(s).trim()).optional().nullable(),
  iccid: z.number().or(z.string()).transform(v => {
    let s = String(v).trim();
    // Assuming we want to force format, we handle floats from excel (like scientific notation e.g. 8.95E+18)
    if (s.includes("+") || s.includes("E") || s.includes("e")) {
      // try to parse exact integer using BigInt from exact string if possible, or precision loss could occur.
      // Usually xlsx gives number if not formatted as text.
      return BigInt(Math.floor(Number(v)));
    }
    return s ? BigInt(s) : null;
  }).optional().nullable(),
  imei_adendum: z.number().or(z.string()).transform(v => {
    let s = String(v).trim();
    if (s.includes("+") || s.includes("E") || s.includes("e")) {
      return BigInt(Math.floor(Number(v)));
    }
    return s ? BigInt(s) : null;
  }).optional().nullable(),
  renta_con_iva: z.union([z.string(), z.number()]).transform(v => {
    if(!v) return null;
    const num = Number(String(v).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? null : num;
  }).optional().nullable(),
  fecha_fin_servicio: z.any().transform(excelDateToJSDate).optional().nullable(),
}).refine(data => data.telefono && data.telefono.length > 0, "No valid phone");


exports.syncAdendum = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Archivo no proporcionado" });
    }

    // 1. Get all existing Adendums before anything
    const existingAdendumsDb = await prisma.adendum.findMany({
      select: { telefono: true, renta_con_iva: true, estatus_suscripcion: true }
    });
    // Map by phone
    const existingPhonesMap = new Map(
      existingAdendumsDb.map(a => [a.telefono, a])
    );

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Find the actual header row (Telcel ADENDUMs often have meta-info in the first 2 rows)
    const rawDataArr = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let headerIdx = rawDataArr.findIndex(row => row.includes('Telefono') || row.includes('Teléfono') || row.includes('ICCID'));
    if (headerIdx === -1) headerIdx = 0;

    const rows = xlsx.utils.sheet_to_json(sheet, { raw: true, defval: null, range: headerIdx });

    const added = [];
    const updated = []; // Only track real variations (renta)
    const errors = [];
    const excelPhones = new Set();
    
    // Process rows sequentially
    for (const [index, row] of rows.entries()) {
      const rawData = {
        telefono: row["Telefono"] || row["Teléfono"],
        region: row["Region"] || row["Región"],
        cuenta: row["Cuenta"] || row["Cuenta Responsabilidad de Pago"],
        razon_social: row["Razon Social"] || row["Razón Social"],
        iccid: row["ICCID"],
        imei_adendum: row["IMEI"],
        renta_con_iva: row["Monto de Renta con IVA"],
        fecha_fin_servicio: row["Fecha Fin de Servicio"] || row["Fecha Fin Contrato de Equipo"],
      };

      if (!rawData.telefono) continue;

      try {
        const validated = AdendumSchema.parse(rawData);
        excelPhones.add(validated.telefono);
        
        let targetSuscripcion = "ACTIVO";
        const existsInDb = existingPhonesMap.has(validated.telefono);
        
        if (!existsInDb) {
           targetSuscripcion = "NUEVO_CONTRATO";
           added.push(validated.telefono);
        } else {
           const dbRecord = existingPhonesMap.get(validated.telefono);
           // Target is ACTIVO unless it was NO_ENCONTRADO and came back, or if it was requested to be checked
           if (dbRecord.estatus_suscripcion === "NO_ENCONTRADO_EN_MES_ACTUAL") {
             targetSuscripcion = "NUEVO_CONTRATO"; // O ACTIVO. Lo dejamos como nuevo si regresó, o simplemente pasa a ACTIVO
           }
           if (dbRecord.estatus_suscripcion === "NUEVO_CONTRATO") {
             targetSuscripcion = "NUEVO_CONTRATO"; // keep it until confirmed
           }
           
           // Check rent variation
           if (validated.renta_con_iva !== null && dbRecord.renta_con_iva !== null) {
              if (Math.abs(validated.renta_con_iva - dbRecord.renta_con_iva) > 0.01) {
                 updated.push({
                   telefono: validated.telefono,
                   renta_anterior: dbRecord.renta_con_iva,
                   nueva_renta: validated.renta_con_iva
                 });
              }
           }
        }

        // Upsert Adendum by telefono
        const upsertedAdendum = await prisma.adendum.upsert({
          where: { telefono: validated.telefono },
          create: {
            telefono: validated.telefono,
            region: validated.region || null,
            cuenta: validated.cuenta !== undefined ? validated.cuenta : null,
            razon_social: validated.razon_social || null,
            iccid: validated.iccid !== undefined ? validated.iccid : null,
            imei_adendum: validated.imei_adendum !== undefined ? validated.imei_adendum : null,
            renta_con_iva: validated.renta_con_iva !== undefined ? validated.renta_con_iva : null,
            fecha_fin_servicio: validated.fecha_fin_servicio || null,
            estatus_suscripcion: targetSuscripcion
          },
          update: {
            region: validated.region || undefined,
            cuenta: validated.cuenta !== undefined ? validated.cuenta : undefined,
            razon_social: validated.razon_social || undefined,
            iccid: validated.iccid !== undefined ? validated.iccid : undefined,
            imei_adendum: validated.imei_adendum !== undefined ? validated.imei_adendum : undefined,
            renta_con_iva: validated.renta_con_iva !== undefined ? validated.renta_con_iva : undefined,
            fecha_fin_servicio: validated.fecha_fin_servicio || undefined,
            // If it was NO_ENCONTRADO but now it's in the Excel, set to ACTIVO (or whatever target is determined)
            estatus_suscripcion: existsInDb && targetSuscripcion === "ACTIVO" ? "ACTIVO" : targetSuscripcion
          }
        });

        // Sync with ServiceSlot (Optional feature depending if auto-link is desired here)
        const slot = await prisma.serviceSlot.findUnique({
          where: { telefono: validated.telefono }
        });

        if (slot) {
          if (slot.adendum_id !== upsertedAdendum.id) {
            await prisma.serviceSlot.update({
              where: { id: slot.id },
              data: { adendum_id: upsertedAdendum.id }
            });
          }
        }

      } catch (err) {
        errors.push({ fila: index + 2, telefono: rawData.telefono, error: err.message || err });
      }
    }

    // Identify MISSING (In DB but not in Excel payload)
    const missing = [];
    for (const [phone, record] of existingPhonesMap.entries()) {
      if (!excelPhones.has(phone)) {
        if (record.estatus_suscripcion !== "INACTIVO_PROVEEDOR") {
          missing.push(phone);
        }
      }
    }

    // Mueve a NO_ENCONTRADO_EN_MES_ACTUAL todos los missing
    if (missing.length > 0) {
      await prisma.adendum.updateMany({
        where: { telefono: { in: missing } },
        data: { estatus_suscripcion: "NO_ENCONTRADO_EN_MES_ACTUAL" }
      });
    }

    res.json({
      success: true,
      message: "Sincronización de Adendum completada con módulo de reconciliación",
      data: {
        added,
        missing,
        updated,
        errores: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error("Adendum Sync Error:", error);
    next(error);
  }
};

exports.confirmReconciliation = async (req, res, next) => {
  try {
    // Transaction to update reconciliation states
    await prisma.$transaction(async (tx) => {
      // 1. Nuevas Altas -> ACTIVO
      await tx.adendum.updateMany({
        where: { estatus_suscripcion: "NUEVO_CONTRATO" },
        data: { estatus_suscripcion: "ACTIVO" }
      });

      // 2. Desaparecidas -> INACTIVO_PROVEEDOR
      await tx.adendum.updateMany({
        where: { estatus_suscripcion: "NO_ENCONTRADO_EN_MES_ACTUAL" },
        data: { estatus_suscripcion: "INACTIVO_PROVEEDOR" }
      });
    });

    res.json({ success: true, message: "Conciliación confirmada con éxito. Estados regularizados." });
  } catch(error) {
    next(error);
  }
};
