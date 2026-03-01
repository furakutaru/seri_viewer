-- Make jbisUrl column nullable
ALTER TABLE "horses" ALTER COLUMN "jbisUrl" DROP NOT NULL;
