-- ============================================
-- HanJianNet · MySQL 建库建表脚本
-- 生成方式: EF Core 模型 (AppDbContext) + Pomelo Provider
-- 目标版本: MySQL 8.0+（兼容 5.7 需将 datetime(6) 调整为 datetime）
-- 生成时间: 2026-08-25 10:50:24
-- 字符集:   utf8mb4 / utf8mb4_unicode_ci
-- ============================================

CREATE DATABASE IF NOT EXISTS `hanjian`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hanjian`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
CREATE TABLE `MenuItems` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Key` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Path` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Label` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Icon` longtext CHARACTER SET utf8mb4 NULL,
    `Sort` int NOT NULL,
    `Parent` varchar(255) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime NOT NULL,
    CONSTRAINT `PK_MenuItems` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `WebMenus` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Key` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Path` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Label` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Sort` int NOT NULL,
    `IsEnabled` tinyint(1) NOT NULL,
    `CreatedAt` datetime NOT NULL,
    `UpdatedAt` datetime NULL,
    CONSTRAINT `PK_WebMenus` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Permissions` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Key` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Group` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime NOT NULL,
    CONSTRAINT `PK_Permissions` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `RolePermissions` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `RoleKey` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PermissionKey` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime NOT NULL,
    CONSTRAINT `PK_RolePermissions` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Roles` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Key` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Sort` int NOT NULL,
    `IsBuiltIn` tinyint(1) NOT NULL,
    `CreatedAt` datetime NOT NULL,
    CONSTRAINT `PK_Roles` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Traitors` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CourtesyName` longtext CHARACTER SET utf8mb4 NULL,
    `Pseudonym` longtext CHARACTER SET utf8mb4 NULL,
    `BirthYear` int NULL,
    `DeathYear` int NULL,
    `BirthYearType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `DeathYearType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `NativePlace` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AliasesJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IdentityTagsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Period` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Faction` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Summary` longtext CHARACTER SET utf8mb4 NOT NULL,
    `RelatedIdsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime NOT NULL,
    `UpdatedAt` datetime NOT NULL,
    CONSTRAINT `PK_Traitors` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Users` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Username` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `Attachments` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Url` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Kind` longtext CHARACTER SET utf8mb4 NOT NULL,
    `FileType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Caption` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Attachments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Attachments_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Children` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Gender` longtext CHARACTER SET utf8mb4 NULL,
    `Whereabouts` longtext CHARACTER SET utf8mb4 NULL,
    `Remark` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Children` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Children_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `CrimeRecords` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Year` int NULL,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Process` longtext CHARACTER SET utf8mb4 NULL,
    `Harm` longtext CHARACTER SET utf8mb4 NULL,
    `SourceRef` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_CrimeRecords` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CrimeRecords_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `LifeEvents` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Year` int NULL,
    `Event` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SourceRef` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_LifeEvents` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_LifeEvents_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Residences` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Place` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Period` longtext CHARACTER SET utf8mb4 NULL,
    `Remark` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Residences` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Residences_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Sources` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Citation` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Credibility` int NULL,
    CONSTRAINT `PK_Sources` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Sources_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Spouses` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Remark` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Spouses` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Spouses_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Revisions` (
    `Id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `TraitorId` varchar(255) CHARACTER SET utf8mb4 NULL,
    `SubmitterId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `SubmittedAt` datetime NOT NULL,
    `ChangeSummary` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PayloadJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ReviewerId` varchar(255) CHARACTER SET utf8mb4 NULL,
    `ReviewedAt` datetime NULL,
    `ReviewResult` longtext CHARACTER SET utf8mb4 NULL,
    `ReviewComment` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Revisions` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Revisions_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `Traitors` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_Revisions_Users_ReviewerId` FOREIGN KEY (`ReviewerId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Revisions_Users_SubmitterId` FOREIGN KEY (`SubmitterId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE INDEX `IX_Attachments_TraitorId` ON `Attachments` (`TraitorId`);


CREATE INDEX `IX_Children_TraitorId` ON `Children` (`TraitorId`);


CREATE INDEX `IX_CrimeRecords_TraitorId` ON `CrimeRecords` (`TraitorId`);


CREATE INDEX `IX_LifeEvents_TraitorId` ON `LifeEvents` (`TraitorId`);


CREATE UNIQUE INDEX `IX_MenuItems_Key` ON `MenuItems` (`Key`);


CREATE INDEX `IX_MenuItems_Parent` ON `MenuItems` (`Parent`);


CREATE UNIQUE INDEX `IX_MenuItems_Path` ON `MenuItems` (`Path`);


CREATE INDEX `IX_MenuItems_Sort` ON `MenuItems` (`Sort`);


CREATE UNIQUE INDEX `IX_Permissions_Key` ON `Permissions` (`Key`);


CREATE INDEX `IX_Residences_TraitorId` ON `Residences` (`TraitorId`);


CREATE INDEX `IX_Revisions_ReviewerId` ON `Revisions` (`ReviewerId`);


CREATE INDEX `IX_Revisions_SubmitterId` ON `Revisions` (`SubmitterId`);


CREATE INDEX `IX_Revisions_TraitorId` ON `Revisions` (`TraitorId`);


CREATE INDEX `IX_RolePermissions_PermissionKey` ON `RolePermissions` (`PermissionKey`);


CREATE INDEX `IX_RolePermissions_RoleKey` ON `RolePermissions` (`RoleKey`);


CREATE UNIQUE INDEX `IX_RolePermissions_RoleKey_PermissionKey` ON `RolePermissions` (`RoleKey`, `PermissionKey`);


CREATE UNIQUE INDEX `IX_Roles_Key` ON `Roles` (`Key`);


CREATE INDEX `IX_Roles_Sort` ON `Roles` (`Sort`);


CREATE INDEX `IX_Sources_TraitorId` ON `Sources` (`TraitorId`);


CREATE INDEX `IX_Spouses_TraitorId` ON `Spouses` (`TraitorId`);


CREATE UNIQUE INDEX `IX_Users_Email` ON `Users` (`Email`);


CREATE UNIQUE INDEX `IX_Users_Username` ON `Users` (`Username`);
CREATE UNIQUE INDEX `IX_WebMenus_Key` ON `WebMenus` (`Key`);
CREATE INDEX `IX_WebMenus_IsEnabled` ON `WebMenus` (`IsEnabled`);
CREATE UNIQUE INDEX `IX_WebMenus_Path` ON `WebMenus` (`Path`);
CREATE INDEX `IX_WebMenus_Sort` ON `WebMenus` (`Sort`);

SET FOREIGN_KEY_CHECKS = 1;
