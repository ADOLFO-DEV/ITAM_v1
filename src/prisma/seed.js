const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

function cleanTelefono(tel) {
  if (!tel) return null;
  const cleaned = String(tel).replace(/\D/g, ''); // Eliminar todos los caracteres no numéricos
  if (cleaned.length >= 10) {
    return cleaned.slice(-10); // Obtener los últimos 10 dígitos
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

function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'number') {
    // 25569 = dif de días entre 1900-01-01 y 1970-01-01
    return new Date((excelDate - 25569) * 86400 * 1000);
  }
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
  console.log(`Se encontraron ${data.length} filas en la hoja '${sheetName}'.\n`);

  let countProcessed = 0;
  let countErrors = 0;
  let countSkipped = 0;

  for (const [index, row] of data.entries()) {
    const rowNum = index + 2; // +1 por base 0-index, +1 por el encabezado
    try {
      const telefonoOriginal = row['TELEFONO'];
      const telefonoLimpio = cleanTelefono(telefonoOriginal);

      if (!telefonoLimpio || telefonoLimpio.length !== 10) {
        console.warn(`⚠️ Fila ${rowNum}: Omitida - Teléfono vacío o inválido (${telefonoOriginal || 'vacío'})`);
        countSkipped++;
        continue; // Ignora la fila
      }

      // 1. Normalización de Empleado
      const nomina = cleanNomina(row['NOMINA']);
      const nombreCompleto = buildFullName(row['NOMBRE'], row['APELLIDO PATERNO'], row['APELLIDO MATERNO']);
      const centroCostos = String(row['CC'] || '').trim() || null;
      const tienda = String(row['TIENDA'] || '').trim() || null;
      const puesto = String(row['Puesto por Asociación'] || '').trim() || null;
      
      // Manejar variante con espacio o sin espacio del excel
      const distritoRaw = row['DISTRITO '] !== undefined ? row['DISTRITO '] : row['DISTRITO'];
      const distrito = String(distritoRaw || '').trim() || null;

      // Upsert Employee
      const employee = await prisma.employee.upsert({
        where: { numero_empleado: nomina },
        update: {
          nombre_completo: nombreCompleto,
          puesto: puesto,
          centro_costos: centroCostos,
          tienda: tienda,
          distrito: distrito
        },
        create: {
          numero_empleado: nomina,
          nombre_completo: nombreCompleto,
          puesto: puesto,
          centro_costos: centroCostos,
          tienda: tienda,
          distrito: distrito
        }
      });

      // 2. Normalización de Slot
      const imeiRaw = row['IMEI CONSOLA'] || row['IMEI ADENDUM'] || row['IMEI'];
      let imeiLimpio = String(imeiRaw || '').trim();
      if (!imeiLimpio) imeiLimpio = null; // para evitar unique constraint blocks de prisma con strings vacios

      const modeloRaw = row[' MODELO CONSOLA '] || row['MODELO CONSOLA'] || row[' MODELO '] || row['MODELO'];
      const modelo = String(modeloRaw || '').trim() || null;
      
      const gamaRaw = row[' GAMA '] || row['GAMA'];
      const gama = String(gamaRaw || '').trim() || null;
      
      const simRaw = row['SIM '] || row['SIM'];
      const sim = String(simRaw || '').trim() || null;
      
      const fechaRaw = row['FECHA DE RENOVACION '] !== undefined ? row['FECHA DE RENOVACION '] : row['FECHA DE RENOVACION'];
      const fechaRenovacion = parseExcelDate(fechaRaw);

      // Upsert ServiceSlot
      try {
        await prisma.serviceSlot.upsert({
          where: { telefono: telefonoLimpio },
          update: {
            employee_id: employee.numero_empleado,
            imei: imeiLimpio,
            modelo: modelo,
            gama: gama,
            sim: sim,
            fecha_renovacion: fechaRenovacion,
            estatus: 'ACTIVO'
          },
          create: {
            telefono: telefonoLimpio,
            employee_id: employee.numero_empleado,
            imei: imeiLimpio,
            modelo: modelo,
            gama: gama,
            sim: sim,
            fecha_renovacion: fechaRenovacion,
            estatus: 'ACTIVO'
          }
        });
      } catch (upsertError) {
        // Manejar el error de restricción única en 'imei' (P2002 de Prisma)
        if (upsertError.code === 'P2002' && upsertError.meta?.target?.includes('imei')) {
          console.warn(`    ⚠️ IMEI Duplicado detectado (${imeiLimpio}) para el teléfono ${telefonoLimpio}. Guardando sin IMEI...`);
          await prisma.serviceSlot.upsert({
            where: { telefono: telefonoLimpio },
            update: {
              employee_id: employee.numero_empleado,
              imei: null, // Forzamos guardar la línea pero sin IMEI conflictivo
              modelo: modelo,
              gama: gama,
              sim: sim,
              fecha_renovacion: fechaRenovacion,
              estatus: 'ACTIVO'
            },
            create: {
              telefono: telefonoLimpio,
              employee_id: employee.numero_empleado,
              imei: null, // Forzamos guardar la línea pero sin IMEI conflictivo
              modelo: modelo,
              gama: gama,
              sim: sim,
              fecha_renovacion: fechaRenovacion,
              estatus: 'ACTIVO'
            }
          });
        } else {
          // Si es otro tipo de error, lo propagamos para que lo atrape el bloque principal
          throw upsertError;
        }
      }

      countProcessed++;
      if (countProcessed % 100 === 0) {
        console.log(`⏳ Progreso: ${countProcessed} registros procesados...`);
      }

    } catch (error) {
      console.error(`❌ Error procesando fila ${rowNum}:`, error.message);
      countErrors++;
    }
  }

  console.log('\n--- Resumen Final ---');
  console.log(`✅ Total procesados exitosamente: ${countProcessed}`);
  console.log(`⏭️  Total omitidos (teléfono inválido): ${countSkipped}`);
  console.log(`❌ Total con errores inesperados: ${countErrors}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
