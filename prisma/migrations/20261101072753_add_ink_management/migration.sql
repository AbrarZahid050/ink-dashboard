-- CreateEnum
CREATE TYPE "InkType" AS ENUM ('UV', 'SOLVENT', 'ECO_SOLVENT', 'SUBLIMATION', 'LATEX', 'OTHER');

-- CreateEnum
CREATE TYPE "InkPackagingType" AS ENUM ('BOTTLE', 'POUCH', 'CARTRIDGE', 'BULK', 'OTHER');

-- CreateTable
CREATE TABLE "InkModel" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "manufacturerId" UUID NOT NULL,
    "inkName" TEXT NOT NULL,
    "inkType" "InkType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InkProduct" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "inkModelId" UUID NOT NULL,
    "productCode" TEXT,
    "color" TEXT NOT NULL,
    "packagingType" "InkPackagingType" NOT NULL,
    "capacityMl" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InkLot" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "inkProductId" UUID NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "expiryDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InkModel_manufacturerId_inkName_key" ON "InkModel"("manufacturerId", "inkName");

-- CreateIndex
CREATE UNIQUE INDEX "InkProduct_productCode_key" ON "InkProduct"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "InkLot_inkProductId_lotNumber_key" ON "InkLot"("inkProductId", "lotNumber");

-- AddForeignKey
ALTER TABLE "InkModel" ADD CONSTRAINT "InkModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkProduct" ADD CONSTRAINT "InkProduct_inkModelId_fkey" FOREIGN KEY ("inkModelId") REFERENCES "InkModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkLot" ADD CONSTRAINT "InkLot_inkProductId_fkey" FOREIGN KEY ("inkProductId") REFERENCES "InkProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
