-- Add version column for optimistic concurrency control.
ALTER TABLE "Machine"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
