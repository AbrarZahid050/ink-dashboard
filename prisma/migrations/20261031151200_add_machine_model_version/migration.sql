-- Add version column for optimistic concurrency control to MachineModel.
ALTER TABLE "MachineModel"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
