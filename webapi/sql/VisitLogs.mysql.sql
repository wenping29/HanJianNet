CREATE TABLE `VisitLogs` (
    `Id` bigint NOT NULL AUTO_INCREMENT,
    `VisitorToken` varchar(128) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_VisitLogs` PRIMARY KEY (`Id`)
);
CREATE INDEX `IX_VisitLogs_CreatedAt` ON `VisitLogs` (`CreatedAt`);
CREATE INDEX `IX_VisitLogs_VisitorToken` ON `VisitLogs` (`VisitorToken`);
