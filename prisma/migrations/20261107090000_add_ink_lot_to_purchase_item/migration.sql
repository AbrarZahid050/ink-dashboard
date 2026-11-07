-- Add the optional lot reference to preserve historical invoice items.
-- New API-created sales lines are required to provide an inkLotId.

ALTER TABLE "InkPurchaseItem"
ADD COLUMN "inkLotId" UUID;

CREATE INDEX "InkPurchaseItem_inkLotId_idx"
ON "InkPurchaseItem"("inkLotId");

ALTER TABLE "InkPurchaseItem"
ADD CONSTRAINT "InkPurchaseItem_inkLotId_fkey"
FOREIGN KEY ("inkLotId") REFERENCES "InkLot"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
