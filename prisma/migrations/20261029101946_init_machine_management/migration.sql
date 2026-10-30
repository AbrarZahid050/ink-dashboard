-- CreateEnum
CREATE TYPE "MachineTechnology" AS ENUM ('SOLVENT', 'LATEX', 'UV', 'SUBLIMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MachineConfiguration" AS ENUM ('ROLL_TO_ROLL', 'FLATBED', 'HYBRID');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECOMMISSIONED');

-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineModel" (
    "id" UUID NOT NULL,
    "manufacturerId" UUID NOT NULL,
    "modelName" TEXT NOT NULL,
    "technology" "MachineTechnology" NOT NULL,
    "configuration" "MachineConfiguration" NOT NULL,
    "maxRollWidthMm" INTEGER,
    "flatbedWidthMm" INTEGER,
    "flatbedLengthMm" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSite" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" UUID NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "machineModelId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "installationDate" DATE NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MachineModel_manufacturerId_modelName_key" ON "MachineModel"("manufacturerId", "modelName");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSite_customerId_name_key" ON "CustomerSite"("customerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_serialNumber_key" ON "Machine"("serialNumber");

-- AddForeignKey
ALTER TABLE "MachineModel" ADD CONSTRAINT "MachineModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSite" ADD CONSTRAINT "CustomerSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_machineModelId_fkey" FOREIGN KEY ("machineModelId") REFERENCES "MachineModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "CustomerSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
