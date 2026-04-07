const fs = require('fs');
const path = require('path');
const employeeController = require('../src/controllers/employee.controller');

async function runSyncFromConsole() {
  const filePath = path.join(__dirname, '../LISTADO.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error("❌ El archivo LISTADO.xlsx no se encuentra en el directorio raíz del proyecto.");
    process.exit(1);
  }

  console.log("📄 Cargando archivo:", filePath);
  const fileBuffer = fs.readFileSync(filePath);

  // Mock Request Object
  const req = {
    file: {
      buffer: fileBuffer,
      originalname: "LISTADO.xlsx"
    }
  };

  // Mock Response Object
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      if (this.statusCode >= 400) {
        console.error("\n❌ Error en la sincronización:");
        console.error(data);
      } else {
        console.log("\n✅ ¡Sincronización completada exitosamente!");
        console.log("📊 Resultados:");
        console.log(` - Total leídos del archivo: \x1b[36m${data.total_procesados.total_en_archivo}\x1b[0m`);
        console.log(` - Nuevos Ingresos: \x1b[32m${data.total_procesados.nuevos}\x1b[0m`);
        console.log(` - Bajas Detectadas: \x1b[31m${data.total_procesados.bajas}\x1b[0m`);
        console.log(` - Errores de fila: ${data.total_procesados.errores_validacion_filas}`);
      }
      process.exit(this.statusCode >= 400 ? 1 : 0);
    }
  };

  // Mock Next Function
  const next = (err) => {
    console.error("\n💥 Excepción del Servidor Detectada:");
    console.error(err);
    process.exit(1);
  };

  console.log("⚙️  Procesando actualización masiva de Headcount (esto puede tomar unos momentos)...");
  
  try {
    await employeeController.syncHeadcount(req, res, next);
  } catch (error) {
    console.error("Error crítico ejecutando el script:", error);
    process.exit(1);
  }
}

runSyncFromConsole();
