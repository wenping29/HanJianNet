-- ============================================
-- HanJianNet · SQLite 建库建表脚本
-- 源数据库: hanjian.db
-- 生成时间: 2026-08-25 10:47:56
-- 表数量: 14  索引数量: 22
-- ============================================

PRAGMA foreign_keys = OFF;

-- 建表（含主键、外键、UNIQUE 约束）
-- ---------------- Attachments ----------------
CREATE TABLE "Attachments" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Attachments" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Url" TEXT NOT NULL,
    "Kind" TEXT NOT NULL,
    "FileType" TEXT NOT NULL,
    "Caption" TEXT NULL,
    CONSTRAINT "FK_Attachments_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- Children ----------------
CREATE TABLE "Children" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Children" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Gender" TEXT NULL,
    "Whereabouts" TEXT NULL,
    "Remark" TEXT NULL,
    CONSTRAINT "FK_Children_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- CrimeRecords ----------------
CREATE TABLE "CrimeRecords" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_CrimeRecords" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Year" INTEGER NULL,
    "Title" TEXT NOT NULL,
    "Process" TEXT NULL,
    "Harm" TEXT NULL,
    "SourceRef" TEXT NULL,
    CONSTRAINT "FK_CrimeRecords_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- LifeEvents ----------------
CREATE TABLE "LifeEvents" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_LifeEvents" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Year" INTEGER NULL,
    "Event" TEXT NOT NULL,
    "SourceRef" TEXT NULL,
    CONSTRAINT "FK_LifeEvents_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- MenuItems ----------------
CREATE TABLE "MenuItems" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_MenuItems" PRIMARY KEY,
    "Key" TEXT NOT NULL,
    "Path" TEXT NOT NULL,
    "Label" TEXT NOT NULL,
    "Icon" TEXT NULL,
    "Sort" INTEGER NOT NULL,
    "Parent" TEXT NULL,
    "CreatedAt" TEXT NOT NULL
);

-- ---------------- WebMenus ----------------
CREATE TABLE "WebMenus" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_WebMenus" PRIMARY KEY,
    "Key" TEXT NOT NULL,
    "Path" TEXT NOT NULL,
    "Label" TEXT NOT NULL,
    "Sort" INTEGER NOT NULL,
    "IsEnabled" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NULL
);

-- ---------------- Permissions ----------------
CREATE TABLE "Permissions" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Permissions" PRIMARY KEY,
    "Key" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Group" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

-- ---------------- Residences ----------------
CREATE TABLE "Residences" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Residences" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Place" TEXT NOT NULL,
    "Period" TEXT NULL,
    "Remark" TEXT NULL,
    CONSTRAINT "FK_Residences_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- Revisions ----------------
CREATE TABLE "Revisions" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Revisions" PRIMARY KEY,
    "TraitorId" TEXT NULL,
    "SubmitterId" TEXT NOT NULL,
    "SubmittedAt" TEXT NOT NULL,
    "ChangeSummary" TEXT NOT NULL,
    "PayloadJson" TEXT NOT NULL,
    "Status" TEXT NOT NULL,
    "ReviewerId" TEXT NULL,
    "ReviewedAt" TEXT NULL,
    "ReviewResult" TEXT NULL,
    "ReviewComment" TEXT NULL,
    CONSTRAINT "FK_Revisions_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Revisions_Users_ReviewerId" FOREIGN KEY ("ReviewerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Revisions_Users_SubmitterId" FOREIGN KEY ("SubmitterId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

-- ---------------- RolePermissions ----------------
CREATE TABLE "RolePermissions" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_RolePermissions" PRIMARY KEY,
    "RoleKey" TEXT NOT NULL,
    "PermissionKey" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

-- ---------------- Roles ----------------
CREATE TABLE "Roles" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Roles" PRIMARY KEY,
    "Key" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Sort" INTEGER NOT NULL,
    "IsBuiltIn" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

-- ---------------- Sources ----------------
CREATE TABLE "Sources" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Sources" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Citation" TEXT NOT NULL,
    "Credibility" INTEGER NULL,
    CONSTRAINT "FK_Sources_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- Spouses ----------------
CREATE TABLE "Spouses" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Spouses" PRIMARY KEY,
    "TraitorId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Remark" TEXT NULL,
    CONSTRAINT "FK_Spouses_Traitors_TraitorId" FOREIGN KEY ("TraitorId") REFERENCES "Traitors" ("Id") ON DELETE CASCADE
);

-- ---------------- Traitors ----------------
CREATE TABLE "Traitors" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Traitors" PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "CourtesyName" TEXT NULL,
    "Pseudonym" TEXT NULL,
    "BirthYear" INTEGER NULL,
    "DeathYear" INTEGER NULL,
    "BirthYearType" TEXT NOT NULL,
    "DeathYearType" TEXT NOT NULL,
    "NativePlace" TEXT NOT NULL,
    "AliasesJson" TEXT NOT NULL,
    "IdentityTagsJson" TEXT NOT NULL,
    "Period" TEXT NOT NULL,
    "Faction" TEXT NOT NULL,
    "Summary" TEXT NOT NULL,
    "RelatedIdsJson" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

-- ---------------- Users ----------------
CREATE TABLE "Users" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Role" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

-- 索引
CREATE INDEX "IX_Attachments_TraitorId" ON "Attachments" ("TraitorId");
CREATE INDEX "IX_Children_TraitorId" ON "Children" ("TraitorId");
CREATE INDEX "IX_CrimeRecords_TraitorId" ON "CrimeRecords" ("TraitorId");
CREATE INDEX "IX_LifeEvents_TraitorId" ON "LifeEvents" ("TraitorId");
CREATE UNIQUE INDEX "IX_MenuItems_Key" ON "MenuItems" ("Key");
CREATE INDEX "IX_MenuItems_Parent" ON "MenuItems" ("Parent");
CREATE UNIQUE INDEX "IX_MenuItems_Path" ON "MenuItems" ("Path");
CREATE INDEX "IX_MenuItems_Sort" ON "MenuItems" ("Sort");
CREATE UNIQUE INDEX "IX_Permissions_Key" ON "Permissions" ("Key");
CREATE INDEX "IX_Residences_TraitorId" ON "Residences" ("TraitorId");
CREATE INDEX "IX_Revisions_ReviewerId" ON "Revisions" ("ReviewerId");
CREATE INDEX "IX_Revisions_SubmitterId" ON "Revisions" ("SubmitterId");
CREATE INDEX "IX_Revisions_TraitorId" ON "Revisions" ("TraitorId");
CREATE INDEX "IX_RolePermissions_PermissionKey" ON "RolePermissions" ("PermissionKey");
CREATE INDEX "IX_RolePermissions_RoleKey" ON "RolePermissions" ("RoleKey");
CREATE UNIQUE INDEX "IX_RolePermissions_RoleKey_PermissionKey" ON "RolePermissions" ("RoleKey", "PermissionKey");
CREATE UNIQUE INDEX "IX_Roles_Key" ON "Roles" ("Key");
CREATE INDEX "IX_Roles_Sort" ON "Roles" ("Sort");
CREATE INDEX "IX_Sources_TraitorId" ON "Sources" ("TraitorId");
CREATE INDEX "IX_Spouses_TraitorId" ON "Spouses" ("TraitorId");
CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username");
CREATE UNIQUE INDEX "IX_WebMenus_Key" ON "WebMenus" ("Key");
CREATE INDEX "IX_WebMenus_IsEnabled" ON "WebMenus" ("IsEnabled");
CREATE UNIQUE INDEX "IX_WebMenus_Path" ON "WebMenus" ("Path");
CREATE INDEX "IX_WebMenus_Sort" ON "WebMenus" ("Sort");

PRAGMA foreign_keys = ON;
