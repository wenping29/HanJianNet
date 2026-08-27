-- ============================================
-- HanJianNet · Province 回填脚本
-- 用途：为已写入数据库、Province 字段为空的 Traitors 记录，
--       依据 NativePlace（籍贯）反推省份，供汉奸地图分省统计使用。
-- 匹配规则与 webapi/Common/ProvinceMatcher 一致（含历史省名映射）。
-- 顺序：先现代省名（3 字 → 2 字），后历史省名（3 字 → 2 字）；
--       现代省名优先，避免历史名误判（如「上海松江」不会被误判为黑龙江）。
-- 幂等：仅更新 Province = '' 的记录，可重复执行，不覆盖已手动设置的值。
-- ============================================

-- ---- 第 0 步：先把历史遗留的 NULL 统一为空串（否则后续 WHERE Province = '' 不匹配 NULL）----
UPDATE `Traitors` SET `Province` = '' WHERE `Province` IS NULL;

-- ---- 现代省名（3 字，优先匹配，长度较长更精确）----
UPDATE `Traitors` SET `Province` = '黑龙江' WHERE `Province` = '' AND `NativePlace` LIKE '%黑龙江%';
UPDATE `Traitors` SET `Province` = '内蒙古' WHERE `Province` = '' AND `NativePlace` LIKE '%内蒙古%';

-- ---- 现代省名（2 字）----
UPDATE `Traitors` SET `Province` = '北京' WHERE `Province` = '' AND `NativePlace` LIKE '%北京%';
UPDATE `Traitors` SET `Province` = '天津' WHERE `Province` = '' AND `NativePlace` LIKE '%天津%';
UPDATE `Traitors` SET `Province` = '上海' WHERE `Province` = '' AND `NativePlace` LIKE '%上海%';
UPDATE `Traitors` SET `Province` = '重庆' WHERE `Province` = '' AND `NativePlace` LIKE '%重庆%';
UPDATE `Traitors` SET `Province` = '河北' WHERE `Province` = '' AND `NativePlace` LIKE '%河北%';
UPDATE `Traitors` SET `Province` = '山西' WHERE `Province` = '' AND `NativePlace` LIKE '%山西%';
UPDATE `Traitors` SET `Province` = '辽宁' WHERE `Province` = '' AND `NativePlace` LIKE '%辽宁%';
UPDATE `Traitors` SET `Province` = '吉林' WHERE `Province` = '' AND `NativePlace` LIKE '%吉林%';
UPDATE `Traitors` SET `Province` = '江苏' WHERE `Province` = '' AND `NativePlace` LIKE '%江苏%';
UPDATE `Traitors` SET `Province` = '浙江' WHERE `Province` = '' AND `NativePlace` LIKE '%浙江%';
UPDATE `Traitors` SET `Province` = '安徽' WHERE `Province` = '' AND `NativePlace` LIKE '%安徽%';
UPDATE `Traitors` SET `Province` = '福建' WHERE `Province` = '' AND `NativePlace` LIKE '%福建%';
UPDATE `Traitors` SET `Province` = '江西' WHERE `Province` = '' AND `NativePlace` LIKE '%江西%';
UPDATE `Traitors` SET `Province` = '山东' WHERE `Province` = '' AND `NativePlace` LIKE '%山东%';
UPDATE `Traitors` SET `Province` = '河南' WHERE `Province` = '' AND `NativePlace` LIKE '%河南%';
UPDATE `Traitors` SET `Province` = '湖北' WHERE `Province` = '' AND `NativePlace` LIKE '%湖北%';
UPDATE `Traitors` SET `Province` = '湖南' WHERE `Province` = '' AND `NativePlace` LIKE '%湖南%';
UPDATE `Traitors` SET `Province` = '广东' WHERE `Province` = '' AND `NativePlace` LIKE '%广东%';
UPDATE `Traitors` SET `Province` = '海南' WHERE `Province` = '' AND `NativePlace` LIKE '%海南%';
UPDATE `Traitors` SET `Province` = '四川' WHERE `Province` = '' AND `NativePlace` LIKE '%四川%';
UPDATE `Traitors` SET `Province` = '贵州' WHERE `Province` = '' AND `NativePlace` LIKE '%贵州%';
UPDATE `Traitors` SET `Province` = '云南' WHERE `Province` = '' AND `NativePlace` LIKE '%云南%';
UPDATE `Traitors` SET `Province` = '陕西' WHERE `Province` = '' AND `NativePlace` LIKE '%陕西%';
UPDATE `Traitors` SET `Province` = '甘肃' WHERE `Province` = '' AND `NativePlace` LIKE '%甘肃%';
UPDATE `Traitors` SET `Province` = '青海' WHERE `Province` = '' AND `NativePlace` LIKE '%青海%';
UPDATE `Traitors` SET `Province` = '广西' WHERE `Province` = '' AND `NativePlace` LIKE '%广西%';
UPDATE `Traitors` SET `Province` = '西藏' WHERE `Province` = '' AND `NativePlace` LIKE '%西藏%';
UPDATE `Traitors` SET `Province` = '宁夏' WHERE `Province` = '' AND `NativePlace` LIKE '%宁夏%';
UPDATE `Traitors` SET `Province` = '新疆' WHERE `Province` = '' AND `NativePlace` LIKE '%新疆%';
UPDATE `Traitors` SET `Province` = '台湾' WHERE `Province` = '' AND `NativePlace` LIKE '%台湾%';
UPDATE `Traitors` SET `Province` = '香港' WHERE `Province` = '' AND `NativePlace` LIKE '%香港%';
UPDATE `Traitors` SET `Province` = '澳门' WHERE `Province` = '' AND `NativePlace` LIKE '%澳门%';

-- ---- 历史省名（3 字）→ 映射到现代省名 ----
UPDATE `Traitors` SET `Province` = '河北' WHERE `Province` = '' AND `NativePlace` LIKE '%察哈尔%';

-- ---- 历史省名（2 字）→ 映射到现代省名 ----
UPDATE `Traitors` SET `Province` = '河北' WHERE `Province` = '' AND `NativePlace` LIKE '%直隶%';
UPDATE `Traitors` SET `Province` = '辽宁' WHERE `Province` = '' AND `NativePlace` LIKE '%奉天%';
UPDATE `Traitors` SET `Province` = '河北' WHERE `Province` = '' AND `NativePlace` LIKE '%热河%';
UPDATE `Traitors` SET `Province` = '内蒙古' WHERE `Province` = '' AND `NativePlace` LIKE '%绥远%';
UPDATE `Traitors` SET `Province` = '四川' WHERE `Province` = '' AND `NativePlace` LIKE '%西康%';
UPDATE `Traitors` SET `Province` = '辽宁' WHERE `Province` = '' AND `NativePlace` LIKE '%安东%';
UPDATE `Traitors` SET `Province` = '辽宁' WHERE `Province` = '' AND `NativePlace` LIKE '%辽北%';
UPDATE `Traitors` SET `Province` = '黑龙江' WHERE `Province` = '' AND `NativePlace` LIKE '%松江%';
UPDATE `Traitors` SET `Province` = '黑龙江' WHERE `Province` = '' AND `NativePlace` LIKE '%合江%';
UPDATE `Traitors` SET `Province` = '黑龙江' WHERE `Province` = '' AND `NativePlace` LIKE '%嫩江%';
UPDATE `Traitors` SET `Province` = '内蒙古' WHERE `Province` = '' AND `NativePlace` LIKE '%兴安%';
UPDATE `Traitors` SET `Province` = '黑龙江' WHERE `Province` = '' AND `NativePlace` LIKE '%满洲%';
UPDATE `Traitors` SET `Province` = '吉林' WHERE `Province` = '' AND `NativePlace` LIKE '%新京%';

-- ---- 校验：查看仍无法识别省份的记录（籍贯为市/县级，需手动补录）----
-- SELECT `Id`, `Name`, `NativePlace` FROM `Traitors` WHERE `Province` = '' AND `NativePlace` <> '';

-- ---- 最后一步：把列改为 NOT NULL DEFAULT ''，与其它字符串列、实体属性保持一致，杜绝再次出现 NULL ----
ALTER TABLE `Traitors` MODIFY COLUMN `Province` longtext CHARACTER SET utf8mb4 NOT NULL DEFAULT '';
