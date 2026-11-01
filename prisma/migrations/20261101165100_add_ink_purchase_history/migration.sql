-- CreateTable
CREATE TABLE "InkPurchase" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "customerId" UUID NOT NULL,
    "purchasedAt" DATE NOT NULL,
    "reference" TEXT,
    "currencyCode" VARCHAR(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InkPurchaseItem" (
    "id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "inkPurchaseId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "inkProductId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InkPurchaseItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InkPurchaseItem_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "InkPurchaseItem_unitPrice_check" CHECK ("unitPrice" IS NULL OR "unitPrice" >= 0)
);

-- CreateIndex
CREATE INDEX "InkPurchase_customerId_purchasedAt_idx" ON "InkPurchase"("customerId", "purchasedAt");

-- CreateIndex
CREATE INDEX "InkPurchaseItem_inkPurchaseId_idx" ON "InkPurchaseItem"("inkPurchaseId");

-- CreateIndex
CREATE INDEX "InkPurchaseItem_machineId_idx" ON "InkPurchaseItem"("machineId");

-- CreateIndex
CREATE INDEX "InkPurchaseItem_inkProductId_idx" ON "InkPurchaseItem"("inkProductId");

-- AddForeignKey
ALTER TABLE "InkPurchase" ADD CONSTRAINT "InkPurchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkPurchaseItem" ADD CONSTRAINT "InkPurchaseItem_inkPurchaseId_fkey" FOREIGN KEY ("inkPurchaseId") REFERENCES "InkPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkPurchaseItem" ADD CONSTRAINT "InkPurchaseItem_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InkPurchaseItem" ADD CONSTRAINT "InkPurchaseItem_inkProductId_fkey" FOREIGN KEY ("inkProductId") REFERENCES "InkProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
