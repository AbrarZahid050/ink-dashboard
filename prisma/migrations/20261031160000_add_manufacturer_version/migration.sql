-- Add version column for optimistic concurrency control to Manufacturer.
ALTER TABLE "Manufacturer"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
