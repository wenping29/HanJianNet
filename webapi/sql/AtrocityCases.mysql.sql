CREATE TABLE IF NOT EXISTS `atrocitycases` (
    `Id` varchar(255) NOT NULL,
    `Name` varchar(500) NOT NULL,
    `Alias` varchar(500) NULL,
    `EventType` varchar(50) NULL,
    `Era` varchar(50) NULL,
    `Year` int NULL,
    `Province` varchar(100) NULL,
    `City` varchar(100) NULL,
    `Location` varchar(500) NULL,
    `IsGeneral` tinyint(1) NOT NULL DEFAULT 0,
    `PersonCount` int NOT NULL DEFAULT 0,
    `Summary` longtext NULL,
    `Keywords` longtext NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    PRIMARY KEY (`Id`),
    KEY `IX_AtrocityCases_Name` (`Name`(191)),
    KEY `IX_AtrocityCases_Province` (`Province`(100)),
    KEY `IX_AtrocityCases_Era` (`Era`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `atrocitycasepersons` (
    `Id` varchar(255) NOT NULL,
    `AtrocityCaseId` varchar(255) NOT NULL,
    `Name` varchar(255) NOT NULL,
    `Location` varchar(255) NULL,
    `IdentityTags` longtext NULL,
    `Sort` int NOT NULL DEFAULT 0,
    `CreatedAt` datetime(6) NOT NULL,
    PRIMARY KEY (`Id`),
    KEY `IX_AtrocityCasePersons_AtrocityCaseId` (`AtrocityCaseId`),
    CONSTRAINT `FK_AtrocityCasePersons_AtrocityCases_AtrocityCaseId`
        FOREIGN KEY (`AtrocityCaseId`) REFERENCES `atrocitycases` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;