const xlsx = require("xlsx");
const { z } = require("zod");

const excelDateToJSDate = (serial) => {
  if (!serial) return null;
  if (serial instanceof Date) return serial;
  if (typeof serial === "number") {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), date_info.getHours(), date_info.getMinutes(), date_info.getSeconds());
  }
  if (typeof serial === 'string') {
    const parsed = new Date(serial);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const AdendumSchema = z.object({
  telefono: z.union([z.string(), z.number()]).transform(s => String(s).replace(/\D/g, "")).refine(s => s.length > 0, "Teléfono es requerido"),
  region: z.union([z.string(), z.number()]).transform(s => String(s).trim()).optional().nullable(),
  cuenta: z.number().or(z.string()).transform(v => (v ? BigInt(v) : null)).optional().nullable(),
  razon_social: z.union([z.string(), z.number()]).transform(s => String(s).trim()).optional().nullable(),
  iccid: z.number().or(z.string()).transform(v => {
    let s = String(v).trim();
    if (s.includes("+") || s.includes("E") || s.includes("e")) {
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
  renta_con_iva: z.number().or(z.string()).transform(v => (v ? Number(v) : null)).optional().nullable(),
  fecha_fin_servicio: z.any().transform(excelDateToJSDate).optional().nullable(),
}).refine(data => data.telefono && data.telefono.length > 0, "No valid phone");

const workbook = xlsx.readFile("ADENDUM.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { raw: true, defval: null });

let valids = 0;
let errors = [];

for (const row of rows) {
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
        AdendumSchema.parse(rawData);
        valids++;
    } catch(err) {
        if(errors.length < 3) errors.push(err);
    }
}
console.log(`Valids: ${valids}`);
console.log(JSON.stringify(errors[0], null, 2));

