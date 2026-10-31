-- Add version column for optimistic concurrency control to Customer.
ALTER TABLE "Customer"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
