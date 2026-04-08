const xlsx = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "LISTADO.xlsx");
console.log("Reading file:", filePath);

// Read the workbook
const workbook = xlsx.readFile(filePath);
console.log("Sheet names:", workbook.SheetNames);

// Let's check the first sheet
const firstSheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[firstSheetName];

  // Use header: 1 to get array of arrays, so we can inspect exactly what the headers are
const rawDataObjects = xlsx.utils.sheet_to_json(sheet);
console.log("\nTotal rows parsed as objects:", rawDataObjects.length);

const { z } = require("zod");
const employeeRowSchema = z
  .object({
    "Numero de Empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    "Número de Empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    "Número de empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    numero_empleado: z.union([z.string(), z.number()]).transform(String).optional(),
    Nombre: z.string().optional().default(""),
    "Apellido Paterno": z.string().optional().default(""),
    "Apellido Materno": z.string().optional().default(""),
    nombre_completo: z.string().optional(),
    puesto: z.string().optional(),
    Puesto: z.string().optional(),
    "Posición": z.string().optional(),
    "Centro de Costos": z.string().optional(),
    centro_costos: z.string().optional(),
    Distrito: z.string().optional(),
    distrito: z.string().optional(),
    "Atributo Distrito": z.string().optional(),
    Tienda: z.string().optional(),
    tienda: z.string().optional(),
    "Atributo Tienda": z.string().optional(),
  })
  .transform((data) => {
    let numero_empleado = data["Número de Empleado"] || data["Número de empleado"] || data["Numero de Empleado"] || data.numero_empleado || "";
    if (typeof numero_empleado === 'number') numero_empleado = String(numero_empleado);
    else if (typeof numero_empleado === 'string') numero_empleado = numero_empleado.trim();

    let nombre_completo = data.nombre_completo || "";
    if (!nombre_completo) {
      const parts = [data.Nombre, data["Apellido Paterno"], data["Apellido Materno"]]
        .filter((part) => part && part.trim() !== "");
      nombre_completo = parts.join(" ");
    }
    nombre_completo = nombre_completo.toUpperCase().trim();

    const puesto = (data.Puesto || data.puesto || data["Posición"] || null);
    const centro_costos = (data["Centro de Costos"] || data.centro_costos || null);
    const distrito = (data.Distrito || data.distrito || data["Atributo Distrito"] || null);
    const tienda = (data.Tienda || data.tienda || data["Atributo Tienda"] || null);

    return {
      numero_empleado,
      nombre_completo,
      puesto: puesto ? String(puesto).toUpperCase().trim() : null,
      centro_costos: centro_costos ? String(centro_costos).toUpperCase().trim() : null,
      distrito: distrito ? String(distrito).toUpperCase().trim() : null,
      tienda: tienda ? String(tienda).toUpperCase().trim() : null,
    };
  })
  .refine((data) => data.numero_empleado && data.numero_empleado.length > 0, { message: "Could not derive a valid Employee Number" })
  .refine((data) => data.nombre_completo && data.nombre_completo.length > 0, { message: "Could not derive a valid Full Name" });

let passed = 0;
let failed = 0;
for (let i = 0; i < rawDataObjects.length; i++) {
  const result = employeeRowSchema.safeParse(rawDataObjects[i]);
  if (result.success) passed++;
  else {
    failed++;
    if (failed === 1) {
      console.log('--- FIRST FAIL OBJECT ---');
      console.log(rawDataObjects[i]);
      console.log('--- ERROR ---');
      console.log(result.error);
    }
  }
}
console.log(`Passed: ${passed}, Failed: ${failed}`);
