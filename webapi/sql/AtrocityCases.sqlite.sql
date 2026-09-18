CREATE TABLE IF NOT EXISTS "atrocitycases" (
  "Id" TEXT NOT NULL CONSTRAINT "PK_atrocitycases" PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "Alias" TEXT NOT NULL,
  "EventType" TEXT NOT NULL,
  "Era" TEXT NOT NULL,
  "Year" INTEGER,
  "Province" TEXT NOT NULL,
  "City" TEXT NOT NULL,
  "Location" TEXT NOT NULL,
  "IsGeneral" INTEGER NOT NULL,
  "PersonCount" INTEGER NOT NULL,
  "Summary" TEXT NOT NULL,
  "Keywords" TEXT NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  "UpdatedAt" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_atrocitycases_Name" ON "atrocitycases" ("Name");
CREATE INDEX IF NOT EXISTS "IX_atrocitycases_Province" ON "atrocitycases" ("Province");
CREATE INDEX IF NOT EXISTS "IX_atrocitycases_Era" ON "atrocitycases" ("Era");

CREATE TABLE IF NOT EXISTS "atrocitycasepersons" (
  "Id" TEXT NOT NULL CONSTRAINT "PK_atrocitycasepersons" PRIMARY KEY,
  "AtrocityCaseId" TEXT NOT NULL,
  "Name" TEXT NOT NULL,
  "Location" TEXT NOT NULL,
  "IdentityTags" TEXT NOT NULL,
  "Sort" INTEGER NOT NULL,
  "CreatedAt" TEXT NOT NULL,
  CONSTRAINT "FK_atrocitycasepersons_atrocitycases_AtrocityCaseId" FOREIGN KEY ("AtrocityCaseId") REFERENCES "atrocitycases" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_atrocitycasepersons_AtrocityCaseId" ON "atrocitycasepersons" ("AtrocityCaseId");