-- Allow an invoice line to represent ink sold without assigning it to a registered machine.
ALTER TABLE "InkPurchaseItem"
  ALTER COLUMN "machineId" DROP NOT NULL;
