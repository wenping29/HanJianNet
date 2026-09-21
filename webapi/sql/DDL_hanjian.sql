/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = traitors   */
/******************************************/
CREATE TABLE `traitors` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CourtesyName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Pseudonym` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `BirthYear` int DEFAULT NULL,
  `DeathYear` int DEFAULT NULL,
  `BirthYearType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `DeathYearType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `NativePlace` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `AliasesJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `IdentityTagsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Period` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Faction` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `RelatedIdsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  `Province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `City` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Town` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Village` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `MergedIntoId` varchar(64) DEFAULT NULL,
  `MergedAt` datetime DEFAULT NULL,
  `BirthPlace` varchar(255) NOT NULL DEFAULT '',
  `HarmLevel` tinyint DEFAULT NULL COMMENT '危害度 1特级-5四级（NULL=未分级）',
  `Title` varchar(80) DEFAULT NULL COMMENT '伪职（从 Summary 提取的职位，NULL=未提取到）',
  `IsHidden` tinyint(1) NOT NULL DEFAULT '0',
  `HiddenReason` varchar(512) DEFAULT NULL,
  `HiddenAt` datetime DEFAULT NULL,
  `HiddenBy` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Traitors_HarmLevel_CreatedAt` (`HarmLevel`,`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = atrocitycases   */
/******************************************/
CREATE TABLE `atrocitycases` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL COMMENT '事件名称',
  `Alias` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '别名',
  `EventType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '事件类型(惨案/屠杀/大屠杀/事变/战役/国难)',
  `Era` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '时期(宋末/明末/清末/民国/抗日战争时期/其他)',
  `Year` int DEFAULT NULL COMMENT '年份',
  `Province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '省份',
  `City` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '城市',
  `Location` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '发生地点',
  `IsGeneral` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否通用描述（0=具体惨案 1=泛称）',
  `PersonCount` int NOT NULL DEFAULT '0' COMMENT '涉案人员数',
  `Summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  COMMENT '典型罪行摘要/事件描述',
  `Keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  COMMENT '关联检索关键词(JSON)',
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_AtrocityCases_Province` (`Province`),
  KEY `IX_AtrocityCases_Name` (`Name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;


/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = atrocitycasepersons   */
/******************************************/
CREATE TABLE `atrocitycasepersons` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `AtrocityCaseId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL COMMENT '所属事件Id',
  `Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL COMMENT '涉案人员姓名',
  `Location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL COMMENT '人员地级信息',
  `IdentityTags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  COMMENT '身份/罪行描述',
  `Sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_AtrocityCasePersons_AtrocityCaseId` (`AtrocityCaseId`),
  CONSTRAINT `FK_AtrocityCasePersons_AtrocityCases_AtrocityCaseId` FOREIGN KEY (`AtrocityCaseId`) REFERENCES `atrocitycases` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;



/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = attachments   */
/******************************************/
CREATE TABLE `attachments` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Kind` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `FileType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Caption` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_Attachments_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Attachments_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = children   */
/******************************************/
CREATE TABLE `children` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Whereabouts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_Children_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Children_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = cnarea_2023   */
/******************************************/
CREATE TABLE `cnarea_2023` (
  `id` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `level` tinyint unsigned NOT NULL COMMENT '层级',
  `parent_code` mediumint unsigned NOT NULL DEFAULT '0' COMMENT '父级行政代码',
  `area_code` mediumint unsigned NOT NULL DEFAULT '0' COMMENT '行政代码',
  `zip_code` mediumint(6) unsigned zerofill NOT NULL DEFAULT '000000' COMMENT '邮政编码',
  `city_code` char(6) NOT NULL DEFAULT '' COMMENT '区号',
  `name` varchar(50) NOT NULL DEFAULT '' COMMENT '名称',
  `short_name` varchar(50) NOT NULL DEFAULT '' COMMENT '简称',
  `merger_name` varchar(50) NOT NULL DEFAULT '' COMMENT '组合名',
  `pinyin` varchar(30) NOT NULL DEFAULT '' COMMENT '拼音',
  `lng` decimal(10,6) NOT NULL DEFAULT '0.000000' COMMENT '经度',
  `lat` decimal(10,6) NOT NULL DEFAULT '0.000000' COMMENT '纬度',
  `INSERT INTO ````cnarea_2023```` (````level````` varchar(50) DEFAULT NULL,
  ` ````parent_code````` varchar(50) DEFAULT NULL,
  ` ````area_code````` varchar(50) DEFAULT NULL,
  ` ````zip_code````` varchar(50) DEFAULT NULL,
  ` ````city_code````` varchar(50) DEFAULT NULL,
  ` ````name````` varchar(50) DEFAULT NULL,
  ` ````short_name````` varchar(50) DEFAULT NULL,
  ` ````merger_name````` varchar(50) DEFAULT NULL,
  ` ````pinyin````` varchar(50) DEFAULT NULL,
  ` ````lng````` varchar(50) DEFAULT NULL,
  ` ````lat````) VALUES (1` varchar(50) DEFAULT NULL,
  ` 0` varchar(50) DEFAULT NULL,
  ` 110000` varchar(50) DEFAULT NULL,
  ` 000000` varchar(50) DEFAULT NULL,
  ` ''` varchar(50) DEFAULT NULL,
  ` '北京市'` varchar(50) DEFAULT NULL,
  ` '北京'` varchar(50) DEFAULT NULL,
  ` '北京'_1` varchar(50) DEFAULT NULL,
  ` 'BeiJing'` varchar(50) DEFAULT NULL,
  ` 116.407526` varchar(50) DEFAULT NULL,
  ` 39.904030);` varchar(50) DEFAULT NULL,
  `Pro_Code` int DEFAULT NULL COMMENT '省',
  `Coutry_Code` int DEFAULT NULL COMMENT '区县',
  `Chengshi_Code` int DEFAULT NULL COMMENT '市',
  `Town_Code` int DEFAULT NULL COMMENT '乡镇',
  `Village_Code` int DEFAULT NULL COMMENT '村',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`area_code`) USING BTREE,
  KEY `idx_parent_code` (`parent_code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3638 DEFAULT CHARSET=utf8mb3
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = crimerecords   */
/******************************************/
CREATE TABLE `crimerecords` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Year` int DEFAULT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Process` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Harm` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `SourceRef` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`) USING BTREE,
  KEY `IX_CrimeRecords_TraitorId` (`TraitorId`) USING BTREE,
  CONSTRAINT `FK_CrimeRecords_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  ROW_FORMAT=DYNAMIC
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = errorlogs   */
/******************************************/
CREATE TABLE `errorlogs` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Role` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Level` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `ExceptionType` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Message` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `StackTrace` varchar(8192) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `StatusCode` int NOT NULL,
  `Path` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Method` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Query` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `RequestBody` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `UserAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `ClientSource` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = lifeevents   */
/******************************************/
CREATE TABLE `lifeevents` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Year` int DEFAULT NULL,
  `Event` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `SourceRef` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_LifeEvents_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_LifeEvents_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = loginlogs   */
/******************************************/
CREATE TABLE `loginlogs` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `Action` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `UserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Account` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Status` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `StatusCode` int NOT NULL,
  `Message` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `UserAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `ClientSource` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = menuitems   */
/******************************************/
CREATE TABLE `menuitems` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Label` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Icon` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Sort` int NOT NULL,
  `Parent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_MenuItems_Key` (`Key`),
  UNIQUE KEY `IX_MenuItems_Path` (`Path`),
  KEY `IX_MenuItems_Parent` (`Parent`),
  KEY `IX_MenuItems_Sort` (`Sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = notifications   */
/******************************************/
CREATE TABLE `notifications` (
  `Id` varchar(64) NOT NULL,
  `UserId` varchar(64) NOT NULL,
  `Type` varchar(64) NOT NULL DEFAULT '',
  `ReferenceName` varchar(255) NOT NULL DEFAULT '',
  `Comment` text,
  `RevisionId` varchar(64) DEFAULT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Notifications_UserId` (`UserId`),
  KEY `IX_Notifications_CreatedAt` (`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = operationlogs   */
/******************************************/
CREATE TABLE `operationlogs` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Role` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Module` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TargetId` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `TargetLabel` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `StatusCode` int NOT NULL,
  `Status` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Message` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Path` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Method` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `RequestBody` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `ElapsedMs` bigint NOT NULL,
  `Ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `UserAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `ClientSource` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = permissions   */
/******************************************/
CREATE TABLE `permissions` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Group` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Permissions_Key` (`Key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = querylogs   */
/******************************************/
CREATE TABLE `querylogs` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UserId` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Role` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `Module` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Path` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Method` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Query` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `HitCount` int DEFAULT NULL,
  `StatusCode` int NOT NULL,
  `ElapsedMs` bigint NOT NULL,
  `Ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `UserAgent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `ClientSource` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = residences   */
/******************************************/
CREATE TABLE `residences` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Place` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Period` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `Remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_Residences_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Residences_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = revisions   */
/******************************************/
CREATE TABLE `revisions` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `SubmitterId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `SubmittedAt` datetime(6) NOT NULL,
  `ChangeSummary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `PayloadJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `ReviewerId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  DEFAULT NULL,
  `ReviewedAt` datetime(6) DEFAULT NULL,
  `ReviewResult` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  `ReviewComment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_Revisions_ReviewerId` (`ReviewerId`),
  KEY `IX_Revisions_SubmitterId` (`SubmitterId`),
  KEY `IX_Revisions_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Revisions_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `FK_Revisions_Users_ReviewerId` FOREIGN KEY (`ReviewerId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_Revisions_Users_SubmitterId` FOREIGN KEY (`SubmitterId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = rolepermissions   */
/******************************************/
CREATE TABLE `rolepermissions` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `RoleKey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `PermissionKey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_RolePermissions_RoleKey_PermissionKey` (`RoleKey`,`PermissionKey`),
  KEY `IX_RolePermissions_PermissionKey` (`PermissionKey`),
  KEY `IX_RolePermissions_RoleKey` (`RoleKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = roles   */
/******************************************/
CREATE TABLE `roles` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Sort` int NOT NULL,
  `IsBuiltIn` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Roles_Key` (`Key`),
  KEY `IX_Roles_Sort` (`Sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = sources   */
/******************************************/
CREATE TABLE `sources` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Citation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Credibility` int DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Sources_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Sources_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = spouses   */
/******************************************/
CREATE TABLE `spouses` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ,
  PRIMARY KEY (`Id`),
  KEY `IX_Spouses_TraitorId` (`TraitorId`),
  CONSTRAINT `FK_Spouses_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = systemconfigs   */
/******************************************/
CREATE TABLE `systemconfigs` (
  `Id` varchar(64) NOT NULL,
  `Key` varchar(128) NOT NULL,
  `Value` text NOT NULL,
  `Category` varchar(64) NOT NULL,
  `Description` text,
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_SystemConfigs_Key` (`Key`),
  KEY `IX_SystemConfigs_Category` (`Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3
;



/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = users   */
/******************************************/
CREATE TABLE `users` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `PasswordHash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `AvatarUrl` varchar(512) DEFAULT NULL,
  `Gender` varchar(16) DEFAULT NULL,
  `Birthday` varchar(10) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `Phone` varchar(32) DEFAULT NULL,
  `Nickname` varchar(64) DEFAULT NULL,
  `Signature` varchar(255) DEFAULT NULL,
  `Region` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_Users_Email` (`Email`),
  UNIQUE KEY `IX_Users_Username` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = visitlogs   */
/******************************************/
CREATE TABLE `visitlogs` (
  `Id` bigint NOT NULL AUTO_INCREMENT,
  `VisitorToken` varchar(128) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `Path` varchar(256) NOT NULL DEFAULT '',
  PRIMARY KEY (`Id`),
  KEY `IX_VisitLogs_CreatedAt` (`CreatedAt`),
  KEY `IX_VisitLogs_VisitorToken` (`VisitorToken`)
) ENGINE=InnoDB AUTO_INCREMENT=708 DEFAULT CHARSET=utf8mb3
;

/******************************************/
/*   DatabaseName = hanjian   */
/*   TableName = webmenus   */
/******************************************/
CREATE TABLE `webmenus` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Label` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci  NOT NULL,
  `Sort` int NOT NULL,
  `IsEnabled` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_WebMenus_Key` (`Key`),
  UNIQUE KEY `IX_WebMenus_Path` (`Path`),
  KEY `IX_WebMenus_IsEnabled` (`IsEnabled`),
  KEY `IX_WebMenus_Sort` (`Sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
;
