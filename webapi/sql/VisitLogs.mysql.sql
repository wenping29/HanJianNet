CREATE TABLE IF NOT EXISTS `VisitLogs` (
  `Id` BIGINT NOT NULL AUTO_INCREMENT,
  `VisitorToken` VARCHAR(128) NOT NULL,
  `Path` VARCHAR(256) NOT NULL DEFAULT '',
  `CreatedAt` DATETIME(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_VisitLogs_VisitorToken` (`VisitorToken`),
  KEY `IX_VisitLogs_CreatedAt` (`CreatedAt`)
);