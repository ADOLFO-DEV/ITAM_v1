const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const xlsx = require("xlsx");
const { z } = require("zod");

// Define a flexible schema to handle potential variations in column names
const employeeRowSchema = z
  .object({
    "Numero de Empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    "Número de Empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    "Número de empleado": z.union([z.string(), z.number()]).transform(String).optional(),
    numero_empleado: z.union([z.string(), z.number()]).transform(String).optional(),
    Nombre: z.string().optional().default(""),
    "Apellido Paterno": z.string().optional().default(""),
    "Apellido Materno": z.string().optional().default(""),
    // Optional fallback columns in case of slight variations
    nombre_completo: z.union([z.string(), z.number()]).transform(String).optional(),
    puesto: z.union([z.string(), z.number()]).transform(String).optional(),
    Puesto: z.union([z.string(), z.number()]).transform(String).optional(),
    "Posición": z.union([z.string(), z.number()]).transform(String).optional(),
    "Centro de Costos": z.union([z.string(), z.number()]).transform(String).optional(),
    centro_costos: z.union([z.string(), z.number()]).transform(String).optional(),
    Distrito: z.union([z.string(), z.number()]).transform(String).optional(),
    distrito: z.union([z.string(), z.number()]).transform(String).optional(),
    "Atributo Distrito": z.union([z.string(), z.number()]).transform(String).optional(),
    Tienda: z.union([z.string(), z.number()]).transform(String).optional(),
    tienda: z.union([z.string(), z.number()]).transform(String).optional(),
    "Atributo Tienda": z.union([z.string(), z.number()]).transform(String).optional(),
  })
  // After passing structure validation, refine and map down to what we need
  .transform((data) => {
    // Determine the employee number prioritizing all variations
    let numero_empleado = data["Número de Empleado"] || data["Número de empleado"] || data["Numero de Empleado"] || data.numero_empleado || "";
    if (typeof numero_empleado === 'number') numero_empleado = String(numero_empleado);
    else if (typeof numero_empleado === 'string') numero_empleado = numero_empleado.trim();

    // Determine the full name
    let nombre_completo = data.nombre_completo || "";
    if (!nombre_completo) {
      const parts = [data.Nombre, data["Apellido Paterno"], data["Apellido Materno"]]
        .filter((part) => part && part.trim() !== "");
      nombre_completo = parts.join(" ");
    }
    nombre_completo = nombre_completo.toUpperCase().trim();

    // Mapping additional attributes
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
  // Finally ensure the minimum required fields exist natively
  .refine(
    (data) => data.numero_empleado && data.numero_empleado.length > 0,
    { message: "Could not derive a valid Employee Number" }
  )
  .refine(
    (data) => data.nombre_completo && data.nombre_completo.length > 0,
    { message: "Could not derive a valid Full Name" }
  );

exports.syncHeadcount = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No Excel file uploaded. Please upload a file." });
    }

    // 1. Process File
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // Assume first sheet
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ error: "The uploaded file is empty or formatted incorrectly." });
    }

    // 2. Validate row by row
    const incomingEmployees = [];
    let validationErrors = 0;

    for (const row of rawData) {
      const result = employeeRowSchema.safeParse(row);
      if (result.success) {
        incomingEmployees.push(result.data);
      } else {
        // If a row fails to parse it probably means it didn't have Numero de Empleado (maybe empty rows or headers)
        validationErrors++;
      }
    }

    if (incomingEmployees.length === 0) {
      return res.status(400).json({
        error: "Could not parse any valid employees from the file. Ensure columns 'Numero de Empleado' and 'Nombre' exist.",
      });
    }

    // Convert array to Map for fast access
    const incomingMap = new Map();
    for (const emp of incomingEmployees) {
      incomingMap.set(emp.numero_empleado, emp);
    }

    // 3. Get Current Active Data from Database
    const activeEmployees = await prisma.employee.findMany({
      where: { estatus_rh: "ACTIVO" },
    });

    const activeMap = new Map();
    for (const emp of activeEmployees) {
      activeMap.set(emp.numero_empleado, emp);
    }

    // 4. Calculate Diffs (New vs Bajas)
    const newEmployeesToInsert = [];
    const employessBajaList = []; // Array to return the terminated
    const employeesBajaIds = [];

    // Check for News
    for (const [nomina, empData] of incomingMap) {
      if (!activeMap.has(nomina)) {
        newEmployeesToInsert.push(empData);
      }
    }

    // Check for Bajas
    for (const [nomina, activeEmp] of activeMap) {
      if (!incomingMap.has(nomina)) {
        employeesBajaIds.push(nomina);
        employessBajaList.push({
          numero_empleado: nomina,
          nombre_completo: activeEmp.nombre_completo,
        });
      }
    }

    // 5. Execute Transaction
    // Helper function to chunk arrays
    const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

    await prisma.$transaction(async (tx) => {
      // 5.1 Create new employees
      if (newEmployeesToInsert.length > 0) {
        const strictlyNew = [];
        const toReactivate = [];
        
        // Find existing to prevent createMany conflicts (run in chunks to prevent variable limit)
        const newChunks = chunkArray(newEmployeesToInsert, 500);
        for (const chunk of newChunks) {
          const existingAll = await tx.employee.findMany({
            where: { numero_empleado: { in: chunk.map(e => e.numero_empleado) } },
            select: { numero_empleado: true }
          });
          const existingSet = new Set(existingAll.map(e => e.numero_empleado));
          
          strictlyNew.push(...chunk.filter(e => !existingSet.has(e.numero_empleado)));
          toReactivate.push(...chunk.filter(e => existingSet.has(e.numero_empleado)));
        }

        // Insert strictly new in chunks
        if (strictlyNew.length > 0) {
          const insertChunks = chunkArray(strictlyNew, 100); // 100 items * ~7 fields = ~700 vars < 999 SQLite limit
          for (const chunk of insertChunks) {
            await tx.employee.createMany({
              data: chunk.map((emp) => ({
                numero_empleado: emp.numero_empleado,
                nombre_completo: emp.nombre_completo,
                puesto: emp.puesto,
                centro_costos: emp.centro_costos,
                distrito: emp.distrito,
                tienda: emp.tienda,
                estatus_rh: "ACTIVO",
              })),
            });
          }
        }

        // Reactivate soft-deleted employees that came back
        for (const reactEmp of toReactivate) {
          await tx.employee.update({
            where: { numero_empleado: reactEmp.numero_empleado },
            data: { 
              estatus_rh: "ACTIVO",
              nombre_completo: reactEmp.nombre_completo,
              puesto: reactEmp.puesto, 
              centro_costos: reactEmp.centro_costos,
              distrito: reactEmp.distrito,
              tienda: reactEmp.tienda,
            },
          });
        }
      }

      // 5.2 Deactivate Bajas
      if (employeesBajaIds.length > 0) {
        const bajaChunks = chunkArray(employeesBajaIds, 500);
        for (const chunk of bajaChunks) {
          await tx.employee.updateMany({
            where: { numero_empleado: { in: chunk } },
            data: { estatus_rh: "BAJA" },
          });

          // 5.3 Unlink ServiceSlots
          await tx.serviceSlot.updateMany({
            where: { employee_id: { in: chunk } },
            data: { employee_id: null }, // unassign
          });
        }
      }
    });

    // 6. Return response
    return res.status(200).json({
      nuevos_asociados: newEmployeesToInsert.map((e) => ({
        numero_empleado: e.numero_empleado,
        nombre_completo: e.nombre_completo,
      })),
      asociados_baja: employessBajaList,
      total_procesados: {
        total_en_archivo: incomingMap.size,
        nuevos: newEmployeesToInsert.length,
        bajas: employeesBajaIds.length,
        errores_validacion_filas: validationErrors,
      },
    });
  } catch (error) {
    console.error("Error in syncHeadcount:", error);
    next(error);
  }
};
