CREATE TABLE IF NOT EXISTS "atrocitycases" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Alias" TEXT NULL,
    "EventType" TEXT NULL,
    "Era" TEXT NULL,
    "Year" INTEGER NULL,
    "Province" TEXT NULL,
    "City" TEXT NULL,
    "Location" TEXT NULL,
    "IsGeneral" INTEGER NOT NULL DEFAULT 0,
    "PersonCount" INTEGER NOT NULL DEFAULT 0,
    "Summary" TEXT NULL,
    "Keywords" TEXT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    PRIMARY KEY ("Id")
);
CREATE INDEX IF NOT EXISTS "IX_AtrocityCases_Name" ON "atrocitycases" ("Name");
CREATE INDEX IF NOT EXISTS "IX_AtrocityCases_Province" ON "atrocitycases" ("Province");
CREATE INDEX IF NOT EXISTS "IX_AtrocityCases_Era" ON "atrocitycases" ("Era");

CREATE TABLE IF NOT EXISTS "atrocitycasepersons" (
    "Id" TEXT NOT NULL,
    "AtrocityCaseId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Location" TEXT NULL,
    "IdentityTags" TEXT NULL,
    "Sort" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TEXT NOT NULL,
    PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AtrocityCasePersons_AtrocityCases_AtrocityCaseId"
        FOREIGN KEY ("AtrocityCaseId") REFERENCES "atrocitycases" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_AtrocityCasePersons_AtrocityCaseId" ON "atrocitycasepersons" ("AtrocityCaseId");