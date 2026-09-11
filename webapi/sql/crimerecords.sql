-- 犯罪记录表（crimerecords）
-- Name 列存数据来源中的本人姓名（按姓名关联 traitors 时写入），编辑表单不维护。

CREATE TABLE `crimerecords` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `Year` int NULL DEFAULT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Process` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `Harm` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `SourceRef` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `IX_CrimeRecords_TraitorId`(`TraitorId`) USING BTREE,
  CONSTRAINT `FK_CrimeRecords_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- 已存在旧表时，仅补列（MySQL 不支持 ADD COLUMN IF NOT EXISTS）：
-- ALTER TABLE `crimerecords` ADD COLUMN `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL AFTER `TraitorId`;
