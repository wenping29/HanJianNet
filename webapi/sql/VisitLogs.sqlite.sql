CREATE TABLE "VisitLogs" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_VisitLogs" PRIMARY KEY AUTOINCREMENT,
    "VisitorToken" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);
CREATE INDEX "IX_VisitLogs_CreatedAt" ON "VisitLogs" ("CreatedAt");
CREATE INDEX "IX_VisitLogs_VisitorToken" ON "VisitLogs" ("VisitorToken");
