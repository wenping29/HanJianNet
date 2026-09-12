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

 Date: 11/09/2026 21:23:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for children
-- ----------------------------
DROP TABLE IF EXISTS `children`;
CREATE TABLE `children`  (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TraitorId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `Whereabouts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `Remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`Id`) USING BTREE,
  INDEX `IX_Children_TraitorId`(`TraitorId`) USING BTREE,
  CONSTRAINT `FK_Children_Traitors_TraitorId` FOREIGN KEY (`TraitorId`) REFERENCES `traitors` (`Id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
-- 汪精卫子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50101', '2a9185f200f64d3388f0948c654caddd', '汪文婴', '男', '美国加州', '长子，妻谭文素，2011年去世'),
('a1b2c3d4e5f64789a0b1c2d3e4f50102', '2a9185f200f64d3388f0948c654caddd', '汪文惺', '女', '美国新泽西州', '长女，早产儿，曾组织同学请愿抗日，晚年定居美国'),
('a1b2c3d4e5f64789a0b1c2d3e4f50103', '2a9185f200f64d3388f0948c654caddd', '汪文彬', '女', '印度尼西亚', '次女，曾遭绑架，后任印尼政府医药部门高级主管，晚年隐居成为修女'),
('a1b2c3d4e5f64789a0b1c2d3e4f50104', '2a9185f200f64d3388f0948c654caddd', '汪文恂', '女', '香港', '三女，曾任香港大学教育系教授，2002年病故'),
('a1b2c3d4e5f64789a0b1c2d3e4f50105', '2a9185f200f64d3388f0948c654caddd', '汪文悌', '男', '香港', '次子，毕业于南京中央陆军军官学校，战后以汉奸罪判刑，后从事桥梁建筑工作'),
('a1b2c3d4e5f64789a0b1c2d3e4f50106', '2a9185f200f64d3388f0948c654caddd', '姓名不详', NULL, NULL, '汪精卫与陈璧君另有一子夭折');



-- 陈公博子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50201', '3703301fde004f709b31b37fd354b3f7', '陈干', '男', NULL, '后改名杰克·刘'),
('a1b2c3d4e5f64789a0b1c2d3e4f50202', '3703301fde004f709b31b37fd354b3f7', '陈迈', '男', NULL, '资料提及');

-- 周佛海子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50301', '1cd0f5b80764462d98cf3ab4c2a5bb17', '周幼海', '男', '上海', '后改名周之友，1946年加入中国共产党，1985年病逝'),
('a1b2c3d4e5f64789a0b1c2d3e4f50302', '1cd0f5b80764462d98cf3ab4c2a5bb17', '周慧海', '女', NULL, '长女');

-- 陈璧君子女（与汪精卫相同，按独立 TraitorId 插入）
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50401', '3bf0d44294d54192ae33680f9f963078', '汪文婴', '男', '美国加州', '长子，妻谭文素，2011年去世'),
('a1b2c3d4e5f64789a0b1c2d3e4f50402', '3bf0d44294d54192ae33680f9f963078', '汪文惺', '女', '美国新泽西州', '长女，早产儿，曾组织同学请愿抗日，晚年定居美国'),
('a1b2c3d4e5f64789a0b1c2d3e4f50403', '3bf0d44294d54192ae33680f9f963078', '汪文彬', '女', '印度尼西亚', '次女，曾遭绑架，后任印尼政府医药部门高级主管，晚年隐居成为修女'),
('a1b2c3d4e5f64789a0b1c2d3e4f50404', '3bf0d44294d54192ae33680f9f963078', '汪文恂', '女', '香港', '三女，曾任香港大学教育系教授，2002年病故'),
('a1b2c3d4e5f64789a0b1c2d3e4f50405', '3bf0d44294d54192ae33680f9f963078', '汪文悌', '男', '香港', '次子，毕业于南京中央陆军军官学校，战后以汉奸罪判刑，后从事桥梁建筑工作'),
('a1b2c3d4e5f64789a0b1c2d3e4f50406', '3bf0d44294d54192ae33680f9f963078', '姓名不详', NULL, NULL, '另有一子夭折');

-- 褚民谊子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50501', '17b8cfc0e9cb4ebfbec50311e989d999', '褚梦媛', '女', NULL, '女儿'),
('a1b2c3d4e5f64789a0b1c2d3e4f50502', '17b8cfc0e9cb4ebfbec50311e989d999', '姓名不详', NULL, NULL, '资料提及“他们几个孩子”，具体姓名不详');

-- 梁鸿志子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50601', '03aae207b6b84f05bb312e09195cbc4f', '梁文若', '女', NULL, '小女儿，嫁日本军官'),
('a1b2c3d4e5f64789a0b1c2d3e4f50602', '03aae207b6b84f05bb312e09195cbc4f', '姓名不详', '女', NULL, '大女儿，后投河自尽');

-- 王揖唐子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50701', '4d49b9d6cc3f454c921aae11b6c3d70f', '姓名不详', NULL, NULL, '有子女，但具体姓名未见记载');

-- 王克敏子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50801', 'eafad4778fb546608278bb0f0c180fe3', '王遵倜', '女', NULL, '可考女儿之一'),
('a1b2c3d4e5f64789a0b1c2d3e4f50802', 'eafad4778fb546608278bb0f0c180fe3', '王遵侗', '女', NULL, '可考女儿之一'),
('a1b2c3d4e5f64789a0b1c2d3e4f50803', 'eafad4778fb546608278bb0f0c180fe3', '王遵悌', '女', NULL, '可考女儿之一'),
('a1b2c3d4e5f64789a0b1c2d3e4f50804', 'eafad4778fb546608278bb0f0c180fe3', '王遵周', '女', NULL, '可考女儿之一'),
('a1b2c3d4e5f64789a0b1c2d3e4f50805', 'eafad4778fb546608278bb0f0c180fe3', '姓名不详', NULL, NULL, '共12个儿女，其余姓名不详');

-- 张景惠子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f50901', '2714881985834c5892592f92a57939bc', '姓名不详', '男', NULL, '第一夫人所生，患梅毒未育'),
('a1b2c3d4e5f64789a0b1c2d3e4f50902', '2714881985834c5892592f92a57939bc', '姓名不详', '女', NULL, '第一夫人所生，嫁商人王子圃'),
('a1b2c3d4e5f64789a0b1c2d3e4f50903', '2714881985834c5892592f92a57939bc', '姓名不详', '男', NULL, '七夫人徐芷卿所生');

-- 李士群子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51001', 'eb5d0dbf62274f949a1933a47b1d3226', '姓名不详', '男', NULL, '李士群死后被安排出国，下落不明');

-- 梅思平子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51101', '8cff661351514ffcb167a39a3bd675e1', '梅爱文', '女', NULL, '曾公开发文与父亲决裂');

-- 缪斌子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51201', '624eace0be6743519f037e34cba1880b', '姓名不详', '男', '广西', '抗战时在广西牺牲'),
('a1b2c3d4e5f64789a0b1c2d3e4f51202', '624eace0be6743519f037e34cba1880b', '姓名不详', '男', NULL, '缪斌临刑前曾以“二子赴渝”为自己开脱');

-- 周作人子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51301', 'bdf01453b28447e9bac17991034d0af1', '周丰一', '男', NULL, '长子'),
('a1b2c3d4e5f64789a0b1c2d3e4f51302', 'bdf01453b28447e9bac17991034d0af1', '周静子', '女', NULL, '长女'),
('a1b2c3d4e5f64789a0b1c2d3e4f51303', 'bdf01453b28447e9bac17991034d0af1', '周若子', '女', NULL, '次女，15岁病逝');

-- 齐燮元子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51401', '4f4d361d43ec4529912ff6be909ee960', '齐鸿迈', '男', NULL, '舒氏生，1940年病逝'),
('a1b2c3d4e5f64789a0b1c2d3e4f51402', '4f4d361d43ec4529912ff6be909ee960', '齐鸿道', '男', NULL, '陆忠严生，后病逝'),
('a1b2c3d4e5f64789a0b1c2d3e4f51403', '4f4d361d43ec4529912ff6be909ee960', '齐稚忠', '女', NULL, '陆忠严生，齐燮元唯一在世后代');

-- 胡兰成子女
INSERT INTO `children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES
('a1b2c3d4e5f64789a0b1c2d3e4f51501', '3d26e19e007442fd959cae751f00c548', '胡启', '男', NULL, '唐玉凤生，后自杀'),
('a1b2c3d4e5f64789a0b1c2d3e4f51502', '3d26e19e007442fd959cae751f00c548', '姓名不详', '男', NULL, '全慧文生'),
('a1b2c3d4e5f64789a0b1c2d3e4f51503', '3d26e19e007442fd959cae751f00c548', '姓名不详', '男', NULL, '全慧文生'),
('a1b2c3d4e5f64789a0b1c2d3e4f51504', '3d26e19e007442fd959cae751f00c548', '姓名不详', '女', NULL, '全慧文生'),
('a1b2c3d4e5f64789a0b1c2d3e4f51505', '3d26e19e007442fd959cae751f00c548', '姓名不详', '女', NULL, '全慧文生'),
('a1b2c3d4e5f64789a0b1c2d3e4f51506', '3d26e19e007442fd959cae751f00c548', '姓名不详', '女', NULL, '小女儿，自幼被收养');



-- 汪精卫
(UUID(), 'wang_jingwei', '汪文婴', '男', '晚年定居美国', '长子，妻子谭文素，曾留学德国，后在汪伪政权任职'),
(UUID(), 'wang_jingwei', '汪文惺', '女', '后定居美国', '长女，丈夫何孟恒，曾在香港任教'),
(UUID(), 'wang_jingwei', '汪文彬', '女', NULL, '次女，曾任印尼政府医药部门高级主管，后成为修女'),
(UUID(), 'wang_jingwei', '汪文恂', '女', NULL, '三女，曾任香港大学教育系教授，2002年病故'),
(UUID(), 'wang_jingwei', '汪文悌', '男', '在香港从事桥梁建筑工作', '次子，毕业于南京中央陆军军官学校'),

-- 陈公博
(UUID(), 'chen_gongbo', '陈干', NULL, NULL, '陈公博之子'),

-- 梁鸿志
(UUID(), 'liang_hongzhi', '梁渊若', NULL, NULL, '梁鸿志子女之一'),
(UUID(), 'liang_hongzhi', '梁秋若', NULL, NULL, '梁鸿志子女之一'),
(UUID(), 'liang_hongzhi', '梁文若', NULL, NULL, '梁鸿志子女之一'),

-- 王克敏
(UUID(), 'wang_kemin', '王遵倜', NULL, NULL, '王克敏子女之一'),
(UUID(), 'wang_kemin', '王遵侗', NULL, NULL, '王克敏子女之一'),
(UUID(), 'wang_kemin', '王遵悌', NULL, NULL, '王克敏子女之一'),
(UUID(), 'wang_kemin', '王遵周', NULL, NULL, '王克敏子女之一'),
(UUID(), 'wang_kemin', '王遵仲', '男', NULL, '王克敏独子'),

-- 褚民谊
(UUID(), 'chu_minyi', '褚梦媛', '女', NULL, '褚民谊女儿'),
(UUID(), 'chu_minyi', '褚幼义', '男', NULL, '褚民谊儿子'),

-- 张景惠
(UUID(), 'zhang_jinghui', '张绍纪', '男', NULL, '张景惠二儿子，后为红色间谍'),

-- 郑孝胥
(UUID(), 'zheng_xiaoxu', '郑禹', '男', NULL, '郑孝胥次子，曾任伪满奉天市长，1954年以汉奸罪枪决'),

-- 溥仪
(UUID(), 'pu_yi', '毓嵒', '男', NULL, '溥仪嗣子，堂侄'),

-- 张啸林
(UUID(), 'zhang_xiaolin', '张法尧', '男', NULL, '张啸林亲生儿子'),
(UUID(), 'zhang_xiaolin', '张显贵', '男', NULL, '张啸林抱养儿子'),
(UUID(), 'zhang_xiaolin', '张忠尧', '男', NULL, '张啸林抱养儿子'),

-- 李士群
(UUID(), 'li_shiqun', '李闻苏', NULL, NULL, '李士群子女之一'),
(UUID(), 'li_shiqun', '李凯苏', NULL, NULL, '李士群子女之一'),
(UUID(), 'li_shiqun', '李秀扬', NULL, NULL, '李士群子女之一'),

-- 周佛海
(UUID(), 'zhou_fohai', '周幼海', '男', NULL, '周佛海儿子，妻子施丹苹'),

-- 傅筱庵
(UUID(), 'fu_xiaoan', NULL, '男', NULL, '傅筱庵之子，因父亲卖国而精神失常，姓名未见于公开资料');