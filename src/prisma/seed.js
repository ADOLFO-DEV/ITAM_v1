const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

function cleanTelefono(tel) {
  if (!tel) return null;
  const cleaned = String(tel).replace(/\D/g, ''); // Remove all non-numeric characters
  if (cleaned.length >= 10) {
    return cleaned.slice(-10); // Get the last 10 digits
  }
  return null;
}

function cleanNomina(nomina) {
  if (!nomina) return 'SIN_NOMINA';
  const num = parseFloat(nomina);
  if (!isNaN(num)) {
      return String(Math.floor(num));
  }
  const str = String(nomina).trim();
  return str || 'SIN_NOMINA';
}

function buildFullName(nombre, apaterno, amaterno) {
  return [nombre, apaterno, amaterno]
    .map(s => String(s || '').trim())
    .filter(s => s.length > 0)
    .join(' ')
    .toUpperCase();
}

// Convert Excel serial date to JS Date
// Excel dates are days since 1900-01-01 (or 1904-01-01 on some Macs, assuming 1900 here)
function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  
  // If it's already a JS Date object, return it
  if (excelDate instanceof Date) return excelDate;
  
  // If it's a number (Excel serial)
  if (typeof excelDate === 'number') {
    // 25569 is the number of days between 1900-01-01 and 1970-01-01
    return new Date((excelDate - 25569) * 86400 * 1000);
  }

  // Fallback string parsing
  const parsed = new Date(excelDate);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

async function main() {
  console.log('Iniciando carga masiva desde ITAM_DB.xlsx...');
  
  const filePath = path.join(__dirname, '../../ITAM_DB.xlsx');
  
  let workbook;
  try {
    workbook = xlsx.readFile(filePath, { cellDates: true });
  } catch (error) {
    console.error(`Error al leer el archivo Excel: ${error.message}`);
    console.error('Asegúrate de que ITAM_DB.xlsx exista en la raíz del proyecto.');
    process.exit(1);
  }

  const sheetName = 'JAGG';
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    console.error(`No se encontró la hoja '${sheetName}' en el archivo.`);
    process.exit(1);
  }

  const data = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  console.log(`Se encontraron ${data.length} filas en la hoja '${sheetName}'.`);

  let countProcessed = 0;
  let countErrors = 0;

  for (const [index, row] of data.entries()) {
    const rowNum = index + 2; // +1 for 0-index, +1 for header
    try {
      const telefonoOriginal = row['TELEFONO'];
      const telefonoLimpio = cleanTelefono(telefonoOriginal);

      if (!telefonoLimpio) {
        console.warn(`Fila ${rowNum}: Omitida - Teléfono inválido (${telefonoOriginal})`);
        continue;
      }

      const nomina = cleanNomina(row['NOMINA']);
      const nombreCompleto = buildFullName(row['NOMBRE'], row['APELLIDO PATERNO'], row['APELLIDO MATERNO']);
      const centroCostos = String(row['CC'] || '').trim() || null;
      const tienda = String(row['TIENDA'] || '').trim() || null;

      // Upsert Employee
      const employee = await prisma.employee.upsert({
        where: { numero_empleado: nomina },
        update: {
          nombre_completo: nombreCompleto,
          centro_costos: centroCostos,
          tienda: tienda,
        },
        create: {
          numero_empleado: nomina,
          nombre_completo: nombreCompleto,
          centro_costos: centroCostos,
          tienda: tienda,
        }
      });

      // Prepare ServiceSlot data
      // IMEI must be exactly unique if it exists, otherwise leave null to avoid unique constraint violations on empty strings
      let imeiLimpio = String(row['IMEI CONSOLA'] || '').trim();
      if (!imeiLimpio) imeiLimpio = null;

      const modelo = String(row['MODELO'] || '').trim() || null;
      const fechaRenovacion = parseExcelDate(row['FECHA DE RENOVACION']);

      // We use telefono as the unique identifier for Upsert per constraints
      // But wait! Is `telefono` unique in Prisma schema? Yes: `telefono String? @unique`
      
      const slotData = {
        employee_id: employee.numero_empleado,
        imei: imeiLimpio,
        modelo: modelo,
        fecha_fin_plan: fechaRenovacion,
        estatus: 'ASIGNADO' // Assuming active since they are in the sheet, adjust as needed
      };

      await prisma.serviceSlot.upsert({
        where: { telefono: telefonoLimpio },
        update: slotData,
        create: {
          telefono: telefonoLimpio,
          ...slotData
        }
      });

      countProcessed++;
      if (countProcessed % 100 === 0) {
        console.log(`Procesados: ${countProcessed}...`);
      }

    } catch (error) {
      console.error(`Error procesando fila ${rowNum}:`, error.message);
      countErrors++;
    }
  }

  console.log('--- Resumen Final ---');
  console.log(`Total procesados exitosamente: ${countProcessed}`);
  console.log(`Total errores: ${countErrors}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
