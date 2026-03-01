-- Create pedigree URLs table
CREATE TABLE IF NOT EXISTS "pedigreeUrls" (
  "id" SERIAL PRIMARY KEY,
  "horseName" VARCHAR(256) NOT NULL,
  "jbisUrl" VARCHAR(512),
  "lastVerified" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create unique index on horseName
CREATE UNIQUE INDEX IF NOT EXISTS "pedigreeUrls_horseName_unique" ON "pedigreeUrls" ("horseName");
