-- Add version column for optimistic concurrency control to CustomerSite.
ALTER TABLE "CustomerSite"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
