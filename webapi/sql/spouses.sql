/*
 Navicat MySQL Data Transfer

 Source Server         : rm-uf6h9l90mb3na2511bo.mysql.rds.aliyuncs.com_3306
 Source Server Type    : MySQL
 Source Server Version : 80407
 Source Host           : rm-uf6h9l90mb3na2511bo.mysql.rds.aliyuncs.com:3306
 Source Schema         : hanjian

 Target Server Type    : MySQL
 Target Server Version : 80407
 File Encoding         : 65001

 Date: 11/09/2026 21:33:16
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for spouses
-- ----------------------------
DROP TABLE IF EXISTS `spouses`;
CREATE TABLE `spouses`  (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `IX_Spouses_TraitorId`(`TraitorId`) USING BTREE,
  CONSTRAINT `FK_Spouses_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
-- 汪精卫配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50101', '2a9185f200f64d3388f0948c654caddd', '陈璧君', '妻，1912年结婚，汪伪政权重要参与者');

-- 陈公博配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50201', '3703301fde004f709b31b37fd354b3f7', '李励庄', '妻，1920年前后结婚，曾陪同出席中共“一大”'),
('b1c2d3e4f5a64789b0c1d2e3f4a50202', '3703301fde004f709b31b37fd354b3f7', '莫国康', '情人，私人秘书，汪伪政府立法委员'),
('b1c2d3e4f5a64789b0c1d2e3f4a50203', '3703301fde004f709b31b37fd354b3f7', '何焯贤', '情人，生活奢侈，看中地位与金钱'),
('b1c2d3e4f5a64789b0c1d2e3f4a50204', '3703301fde004f709b31b37fd354b3f7', '何炳贤', '情人，生活奢侈，看中地位与金钱');

-- 周佛海配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50301', '1cd0f5b80764462d98cf3ab4c2a5bb17', '郑氏', '原配，农村包办婚姻，后离婚'),
('b1c2d3e4f5a64789b0c1d2e3f4a50302', '1cd0f5b80764462d98cf3ab4c2a5bb17', '杨淑慧', '妻，上海时期伴侣，曾协助寻找中共“一大”会址');

-- 陈璧君配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50401', '3bf0d44294d54192ae33680f9f963078', '汪精卫', '夫，1912年结婚');

-- 褚民谊配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50501', '17b8cfc0e9cb4ebfbec50311e989d999', '陈舜贞', '妻，陈璧君母亲养女');

-- 梁鸿志配偶/情人
-- 资料中未见配偶或情人信息，未生成语句。

-- 王揖唐配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50701', '4d49b9d6cc3f454c921aae11b6c3d70f', '姓名不详', '发妻，早逝'),
('b1c2d3e4f5a64789b0c1d2e3f4a50702', '4d49b9d6cc3f454c921aae11b6c3d70f', '姓名不详', '继室，出身青楼，遭子女登报否认');

-- 王克敏配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50801', 'eafad4778fb546608278bb0f0c180fe3', '姓名不详', '妻妾之一'),
('b1c2d3e4f5a64789b0c1d2e3f4a50802', 'eafad4778fb546608278bb0f0c180fe3', '姓名不详', '妻妾之一'),
('b1c2d3e4f5a64789b0c1d2e3f4a50803', 'eafad4778fb546608278bb0f0c180fe3', '姓名不详', '妻妾之一'),
('b1c2d3e4f5a64789b0c1d2e3f4a50804', 'eafad4778fb546608278bb0f0c180fe3', '姓名不详', '妻妾之一'),
('b1c2d3e4f5a64789b0c1d2e3f4a50805', 'eafad4778fb546608278bb0f0c180fe3', '小阿凤', '五老婆'),
('b1c2d3e4f5a64789b0c1d2e3f4a50806', 'eafad4778fb546608278bb0f0c180fe3', '高玲', '后期伴侣');

-- 张景惠配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a50901', '2714881985834c5892592f92a57939bc', '姓名不详', '第一夫人，台安原籍'),
('b1c2d3e4f5a64789b0c1d2e3f4a50902', '2714881985834c5892592f92a57939bc', '姓名不详', '夫人之一，台安女学生'),
('b1c2d3e4f5a64789b0c1d2e3f4a50903', '2714881985834c5892592f92a57939bc', '徐芷卿', '七夫人，京剧老生名伶');

-- 李士群配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a51001', 'eb5d0dbf62274f949a1933a47b1d3226', '叶吉卿', '妻');

-- 梅思平配偶/情人
-- 资料中未见配偶或情人信息，未生成语句。

-- 缪斌配偶/情人
-- 资料中未见配偶或情人信息，未生成语句。

-- 周作人配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a51301', 'bdf01453b28447e9bac17991034d0af1', '羽太信子', '妻，日本人');

-- 齐燮元配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a51401', '4f4d361d43ec4529912ff6be909ee960', '郑氏', '元配'),
('b1c2d3e4f5a64789b0c1d2e3f4a51402', '4f4d361d43ec4529912ff6be909ee960', '舒氏', '第二任'),
('b1c2d3e4f5a64789b0c1d2e3f4a51403', '4f4d361d43ec4529912ff6be909ee960', '陆忠严', '第三任'),
('b1c2d3e4f5a64789b0c1d2e3f4a51404', '4f4d361d43ec4529912ff6be909ee960', '华泽愉', '第四任，华世奎次女');

-- 胡兰成配偶/情人
INSERT INTO `spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES
('b1c2d3e4f5a64789b0c1d2e3f4a51501', '3d26e19e007442fd959cae751f00c548', '唐玉凤', '配偶之一'),
('b1c2d3e4f5a64789b0c1d2e3f4a51502', '3d26e19e007442fd959cae751f00c548', '全慧文', '配偶之一');
