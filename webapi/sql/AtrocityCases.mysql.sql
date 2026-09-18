CREATE TABLE IF NOT EXISTS `atrocitycases` (
  `Id` VARCHAR(64) NOT NULL,
  `Name` VARCHAR(255) NOT NULL,
  `Alias` VARCHAR(255) NOT NULL,
  `EventType` VARCHAR(128) NOT NULL,
  `Era` VARCHAR(128) NOT NULL,
  `Year` INT NULL,
  `Province` VARCHAR(64) NOT NULL,
  `City` VARCHAR(128) NOT NULL,
  `Location` VARCHAR(255) NOT NULL,
  `IsGeneral` TINYINT(1) NOT NULL,
  `PersonCount` INT NOT NULL,
  `Summary` TEXT NOT NULL,
  `Keywords` TEXT NOT NULL,
  `CreatedAt` DATETIME(6) NOT NULL,
  `UpdatedAt` DATETIME(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_atrocitycases_Name` (`Name`),
  KEY `IX_atrocitycases_Province` (`Province`),
  KEY `IX_atrocitycases_Era` (`Era`)
);

CREATE TABLE IF NOT EXISTS `atrocitycasepersons` (
  `Id` VARCHAR(64) NOT NULL,
  `AtrocityCaseId` VARCHAR(64) NOT NULL,
  `Name` VARCHAR(128) NOT NULL,
  `Location` VARCHAR(255) NOT NULL,
  `IdentityTags` VARCHAR(255) NOT NULL,
  `Sort` INT NOT NULL,
  `CreatedAt` DATETIME(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_atrocitycasepersons_AtrocityCaseId` (`AtrocityCaseId`),
  CONSTRAINT `FK_atrocitycasepersons_atrocitycases_AtrocityCaseId` FOREIGN KEY (`AtrocityCaseId`) REFERENCES `atrocitycases` (`Id`) ON DELETE CASCADE
);