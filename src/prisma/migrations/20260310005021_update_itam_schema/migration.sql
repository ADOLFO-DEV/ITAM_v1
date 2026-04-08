-- CreateTable
CREATE TABLE "SystemUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VIEWER',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Employee" (
    "numero_empleado" TEXT NOT NULL PRIMARY KEY,
    "nombre_completo" TEXT NOT NULL,
    "puesto" TEXT,
    "centro_costos" TEXT,
    "distrito" TEXT,
    "tienda" TEXT,
    "email" TEXT,
    "estatus_rh" TEXT NOT NULL DEFAULT 'ACTIVO',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServiceSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT,
    "telefono" TEXT NOT NULL,
    "imei" TEXT,
    "modelo" TEXT,
    "gama" TEXT,
    "sim" TEXT,
    "estatus" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fecha_inicio" DATETIME,
    "fecha_renovacion" DATETIME,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ServiceSlot_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee" ("numero_empleado") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slot_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "campo_afectado" TEXT,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "usuario_responsable" TEXT,
    CONSTRAINT "AuditLog_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "ServiceSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlot_telefono_key" ON "ServiceSlot"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSlot_imei_key" ON "ServiceSlot"("imei");
