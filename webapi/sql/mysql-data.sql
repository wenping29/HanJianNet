-- ============================================
-- HanJianNet · MySQL 数据导出脚本
-- 源数据库: hanjian.db
-- 生成时间: 2026-08-25 10:59:31
-- 配套结构: mysql-schema.sql（先执行建表）
-- 说明: 字符串使用 MySQL 反斜杠转义；
--       datetime 列已从 SQLite 7 位小数规整为 datetime(6)
--数据导出完成，文件为 webapi/sql/mysql-data.sql（226 行，185 条 INSERT）。
--MySQL 兼容处理：
-- 按外键依赖顺序排列插入（父表→子表），首尾 SET FOREIGN_KEY_CHECKS=0/1 兜底
-- MySQL 反斜杠转义（\ ' 换行等），utf8mb4 中文正常
-- datetime 列从 SQLite 7 位小数规整为 datetime(6) 精度
--验证结果：
-- 1. 回读比对：解析生成文件全部 INSERT，与源库逐单元格比对——185/185 全部一致
-- 2. 语法校验：用 sqlglot 以 MySQL 方言解析全部 188 条语句——全部通过
--使用方式（先建结构再导数据）：
-- mysql -u root -p < sql/mysql-schema.sql   # 建库建表
-- mysql -u root -p hanjian < sql/mysql-data.sql   # 导入数据
--注意：导入后建议将 appsettings.json 的 Database:Provider 切为 "mysql" 并填好连接串启动应用验证；密码哈希（bcrypt）原样迁移，用户无需重置密码。
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users (7 行)
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('1cdc5e7dfe9d4eb5b8df08085ed474a0', 'admin', 'admin@hanjiannet.local', '$2a$11$cRIk2CQ3BqWZTq7CHHx2w.5zY1bOFQRLu8ItxpKlMwYfwu6Ng9T4a', 'superadmin', '2026-08-23 11:24:42.743415');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('3fd874ddbefb42a7ba0e087e7a83a5ef', 'testuser', 'testuser@hanjiannet.local', '$2a$11$dBuyO1RUUXiheRS70jIL1uGMaLnXSXFAV1oo9zxcLFMqU51iGfpj6', 'user', '2026-08-23 11:24:43.769432');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('5268e40985094514810f3df61512d8d1', 'testadmin', 'testadmin@hanjiannet.local', '$2a$11$I.Swne.sc8.aO6xBtrBWlehDI.t4ExiblDUznUOt5kYDew2yPG4hG', 'admin', '2026-08-23 11:24:43.134033');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('587500bb6cae4dfcafe593281c46bd4c', 'testmanager', 'testmanager@hanjiannet.local', '$2a$11$xVJNWaWniG3MlUQK7gMiKOJKMc3XPteY0VrK5yoSMiXQrvkdaN9PG', 'manager', '2026-08-23 11:24:43.457045');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('8b32f4388a9a4e5e9446cbd25b1d90b7', 'testguest', 'testguest@hanjiannet.local', '$2a$11$dfIk8W4QJ/4VUecQ67dyj.hiq.CdNjOlebe3FowO55UuOn3uPJm4K', 'guest', '2026-08-23 11:24:44.078344');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('56c9628b134c4244801b6f00f39ef07f', 'rbac_test', 'rbac_test@hanjiannet.local', '$2a$11$dSWuyL/MeD3IxyvE4lgHmOA1pROiPgHzssBo9XydUxjPoTr69El.S', 'user', '2026-08-23 12:04:28.447055');
INSERT INTO `Users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`) VALUES ('4b1e6d3870e248f98aa608b3e8ef2fcd', 'admin2', 'admin2@test.local', '$2a$11$Ku38rJb21ygL33h9IYp6z.A6GypoXsCd5RXygubjDVzTaFlgrrAo.', 'admin', '2026-08-23 12:12:16.708920');

-- Roles (5 行)
INSERT INTO `Roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('3863bc21de8c4c2c95d005e5376642b9', 'guest', '游客', '仅查看公开档案', 0, 1, '2026-08-23 11:24:42.145459');
INSERT INTO `Roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('43c94ad5b840471db369fa7279122d58', 'user', '普通用户', '提交修订，查看档案', 1, 1, '2026-08-23 11:24:42.145459');
INSERT INTO `Roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('6d75cb9d8b7c4c14883b7ac25470b71c', 'manager', '管理', '审核修订，可编辑档案', 2, 1, '2026-08-23 11:24:42.145459');
INSERT INTO `Roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('7f716519c70345a2b6fc5362a89b45a6', 'admin', '管理员', '系统管理，含用户/角色/菜单管理', 3, 1, '2026-08-23 11:24:42.145458');
INSERT INTO `Roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('802c0cfbbe2949b2b0619c9ebdb34015', 'superadmin', '超级管理员', '拥有全部权限，不可删除', 4, 1, '2026-08-23 11:24:42.145338');

-- Permissions (8 行)
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('4cc8284d1ec94520a7738052706dc6f8', 'profile', '个人信息', 'menu', '2026-08-23 11:24:42.66898');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('5998e12cd39e4426b8670322e52278e6', 'roles', '角色管理', 'menu', '2026-08-23 11:24:42.661372');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('8df50fbefa664c8b8d01294d25510330', 'menus', '菜单管理', 'menu', '2026-08-23 11:24:42.668941');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('949d3499751b47cfbbc4fda85ea21e46', 'users', '用户管理', 'menu', '2026-08-23 11:24:42.668969');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('d6d500629f854eeba59422b5fde8db89', 'traitors', '名录管理', 'menu', '2026-08-23 11:24:42.668989');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('db9673e9f00848e895db8a9eadf0f560', 'system', '系统管理', 'menu', '2026-08-23 11:24:42.668957');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('deb91df4286840179dea6ea6dc00e1c9', 'reviews', '待审队列', 'menu', '2026-08-23 11:24:42.668826');
INSERT INTO `Permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', 'web-menus', '前台菜单', 'menu', '2026-08-25 00:00:00.000000');

-- RolePermissions (20 行)
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('0836b0b8ce4e42239e5a8ef77901d6c7', 'admin', 'traitors', '2026-08-23 11:24:42.700923');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('1f19511ade684dfc9812276dda760f8b', 'superadmin', 'menus', '2026-08-23 11:24:42.700831');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('3e223807f8194624bd0a915c445087af', 'admin', 'menus', '2026-08-23 11:24:42.700822');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('4612dd5ab87f4dd49b1b7285602d7917', 'manager', 'profile', '2026-08-23 11:24:42.700896');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('4968ec7fe4dc4adbb124499dc0dcbe1a', 'superadmin', 'system', '2026-08-23 11:24:42.700860');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('6bd77b66f5b94012aa4285cd321d4ee6', 'manager', 'system', '2026-08-23 11:24:42.700840');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7d70489b099f450d8e8dfcc7496211a9', 'admin', 'users', '2026-08-23 11:24:42.700875');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7dbb329c398942f0ab800f9f9f523eb7', 'superadmin', 'roles', '2026-08-23 11:24:42.700699');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7de7412bee1a462f8dd6be9e366a805a', 'superadmin', 'reviews', '2026-08-23 11:24:42.700811');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('9c36b859be3e49fbba602d1a98a47eaf', 'superadmin', 'profile', '2026-08-23 11:24:42.700913');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('a8a07b7c7d7041a287c2e2799e51b4d7', 'superadmin', 'users', '2026-08-23 11:24:42.700886');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('ac639381b3644944bded28276d710ca2', 'admin', 'roles', '2026-08-23 11:24:42.694827');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('b62102467c9447d2be078beb64c5ef34', 'superadmin', 'traitors', '2026-08-23 11:24:42.700932');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('b6e04ea6631e47c7ae16613e67015ace', 'admin', 'reviews', '2026-08-23 11:24:42.700754');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('bf13aa8b514e428bbb6a1903f5f7dd41', 'admin', 'system', '2026-08-23 11:24:42.700851');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c48aaf753ca54a0da57f07dcc56d3c7b', 'admin', 'profile', '2026-08-23 11:24:42.700904');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('cc61debe4d014585b7e5b5591adbf0fb', 'manager', 'reviews', '2026-08-23 11:24:42.700739');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('00869330caa343488fdde7af6af5a6c1', 'user', 'profile', '2026-08-23 12:11:27.260145');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8', 'admin', 'web-menus', '2026-08-25 00:00:00.000000');
INSERT INTO `RolePermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', 'superadmin', 'web-menus', '2026-08-25 00:00:00.000000');

-- WebMenus (7 行)
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm01', 'home', '/', '首页', 1, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm02', 'lookup', '/lookup', '查询', 2, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm03', 'map', '/map', '汉奸地图', 3, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm04', 'timeline', '/timeline', '时光轴', 4, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm05', 'roster', '/roster', '名录', 5, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm06', 'events', '/events', '事件', 6, 1, '2026-08-25 00:00:00.000000', NULL);
INSERT INTO `WebMenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm07', 'about', '/about', '关于', 7, 1, '2026-08-25 00:00:00.000000', NULL);

-- MenuItems (8 行)
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('0cbdafbe2d214dff89f33bf6e873504e', 'roles', '/roles', '角色管理', NULL, 2, 'system', '2026-08-23 11:24:42.624454');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('39862e515a2749a39408b583f7b6740a', 'reviews', '/reviews', '待审队列', NULL, 2, NULL, '2026-08-23 11:24:42.623541');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('3cfb01bce15041c69d888b43a7c6334b', 'menus', '/menus', '菜单管理', NULL, 3, 'system', '2026-08-23 11:24:42.624724');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('582aa55c3b014a4d8085b5c111b1c73c', 'system', '/system', '系统管理', NULL, 3, NULL, '2026-08-23 11:24:42.623891');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('98c32a7766cb4fd2b2200b95040c5bd5', 'users', '/users', '用户管理', NULL, 1, 'system', '2026-08-23 11:24:42.624169');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('dd450d2d3cd44c3ebbf0a2819389dd89', 'profile', '/profile', '个人信息', NULL, 5, 'system', '2026-08-23 11:24:42.624971');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('f6c9b70f8c014f3d806822f11f83c19b', 'traitors', '/traitors', '名录管理', NULL, 1, NULL, '2026-08-23 11:24:42.598189');
INSERT INTO `MenuItems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'web-menus', '/web-menus', '前台菜单', NULL, 4, 'system', '2026-08-25 00:00:00.000000');

-- Traitors (8 行)
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('5cd9d2c429624c9190edc1a12b5a07da', '殷汝耕', '亦农', NULL, 1885, 1947, 'exact', 'exact', '浙江平阳', '["\\u6BB7\\u4EA6\\u519C"]', '["\\u4F2A\\u5180\\u4E1C\\u9632\\u5171\\u81EA\\u6CBB\\u653F\\u5E9C\\u4E3B\\u5E2D","\\u534E\\u5317\\u8001\\u724C\\u6C49\\u5978"]', '抗日战争时期', '伪冀东防共自治政府 / 汪伪政权', '殷汝耕，字亦农，浙江平阳人。早年留学日本，毕业于早稻田大学，娶日本女子为妻。北洋时期服务于各系军阀。1935年11月25日在河北通县成立「冀东防共自治委员会」，后改称「冀东防共自治政府」，任主席，是抗战前第一个公开独立的汉奸政权。1947年12月1日在南京老虎桥监狱被执行枪决。', '[]', '2026-08-23 12:19:50.915127', '2026-08-23 12:19:50.915128');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('de2f04e471c34e19a14d8b72403fec6a', '汪精卫', '季新', '精卫', 1883, 1944, 'exact', 'exact', '浙江绍兴府山阴县', '["\\u6C6A\\u5146\\u94ED","\\u6C6A\\u5B63\\u65B0"]', '["\\u4F2A\\u56FD\\u6C11\\u653F\\u5E9C\\u4E3B\\u5E2D","\\u5934\\u53F7\\u6C49\\u5978","\\u540C\\u76DF\\u4F1A\\u5143\\u8001","\\u653F\\u6CBB\\u5BB6"]', '抗日战争时期', '汪伪政权 / 中国国民党', '汪兆铭，笔名精卫，历史上多以「汪精卫」称呼。祖籍浙江山阴（今绍兴），出生于广东三水（今属佛山市），是民国时期的重要政治人物。早年投身革命，曾谋刺清摄政王载沣未遂，袁世凯统治时期赴法国留学。回国后于1919年在孙中山领导下，驻上海创办《建设》杂志。1921年孙文在广州就任大总统，汪精卫任广东省教育会长、广东政府顾问。1924年任中央宣传部长。后期思想明显退变，于抗日战争期间投靠日本，在南京成立伪国民政府，沦为汉奸。1944年在日本名古屋因「骨髓肿」病死。', '[]', '2026-08-23 12:23:34.760968', '2026-08-23 12:23:34.760968');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('947e029bf0874fde984f509d4bb0c70c', '陈公博', NULL, NULL, 1892, 1946, 'exact', 'exact', '广东乳源', '[]', '["\\u4F2A\\u7ACB\\u6CD5\\u9662\\u957F","\\u4F2A\\u56FD\\u5E9C\\u4EE3\\u4E3B\\u5E2D","\\u4E8C\\u53F7\\u6C49\\u5978"]', '抗日战争时期', '汪伪政权', '陈公博，原籍广东乳源，寄籍南海。1920年毕业于北京大学哲学系。1921年出席中共一大，1922年退党后赴美留学。1925年加入中国国民党，先后任广东大学教授、国民党中央党部书记长等职。1938年随汪精卫投敌，历任汪伪国民党中央执委、立法院院长、上海市市长、国民政府代主席。1946年4月以汉奸罪在苏州被判处死刑，同年6月3日被枪决。', '[]', '2026-08-23 12:23:34.964761', '2026-08-23 12:23:34.964762');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('8a997e9c473c4d02933ca468d493ca84', '周佛海', NULL, NULL, 1897, 1948, 'exact', 'exact', '湖南沅陵', '[]', '["\\u4F2A\\u884C\\u653F\\u9662\\u526F\\u9662\\u957F","\\u4F2A\\u8D22\\u653F\\u90E8\\u957F","\\u4E09\\u53F7\\u6C49\\u5978"]', '抗日战争时期', '汪伪政权', '周佛海，湖南沅陵人。早年留学日本，1921年作为旅日代表出席中共一大，1924年退出共产党加入国民党。抗战爆发后随汪精卫投敌，历任汪伪国民党中央执委、中央政治委员会委员、行政院副院长兼财政部长、警政部长、中央储备银行总裁。日本投降前与军统戴笠秘密联系，为重庆方面效力。1946年被判处死刑，后蒋介石特赦改判无期徒刑。1948年2月28日病死南京老虎桥监狱。', '[]', '2026-08-23 12:23:35.004373', '2026-08-23 12:23:35.004373');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('ba4b4b594302468d8908433669e0f300', '褚民谊', '重行', NULL, 1884, 1946, 'exact', 'exact', '浙江乌程（今湖州）', '[]', '["\\u4F2A\\u884C\\u653F\\u9662\\u79D8\\u4E66\\u957F","\\u4F2A\\u5916\\u4EA4\\u90E8\\u957F","\\u6C6A\\u4F2A\\u6838\\u5FC3"]', '抗日战争时期', '汪伪政权', '褚民谊，字重行，浙江吴兴人，汪精卫连襟（妻陈舜贞为陈璧君之妹）。早年留学日本、法国，获医学博士学位。1906年加入同盟会，为国民党元老。1939年随汪投敌，历任汪伪国民党中央监察委员会常委、行政院秘书长、外交部长、广东省省长。1946年8月23日以汉奸罪在苏州被执行枪决。', '[]', '2026-08-23 12:23:35.050378', '2026-08-23 12:23:35.050378');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('96c2476c9fc648c58f17d4832e380681', '陈璧君', '冰如', NULL, 1891, 1959, 'exact', 'exact', '广东新会', '["\\u9648\\u51B0\\u5982"]', '["\\u6C6A\\u7CBE\\u536B\\u4E4B\\u59BB","\\u4F2A\\u4E2D\\u592E\\u76D1\\u5BDF\\u59D4\\u5458","\\u5934\\u53F7\\u5973\\u6C49\\u5978"]', '抗日战争时期', '汪伪政权', '陈璧君，字冰如，原籍广东新会，生于马来亚槟榔屿。南洋富商陈耕基之女。1908年在槟城听汪精卫演说后倾心，资助其革命事业。1912年与汪在上海结婚。抗战爆发后极力怂恿汪精卫投敌，是汪集团投敌的核心推手。汪伪政权成立后任伪中央监察委员会常委、政治委员会委员。1945年9月在广州被捕，1946年4月以汉奸罪被判处无期徒刑，1949年后由苏州监狱移送上海提篮桥监狱。1959年6月17日病死于狱中，年68岁。', '[]', '2026-08-23 12:23:35.079977', '2026-08-23 12:23:35.079977');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('dafd3a63886e4dd8b1d67f959a4c862a', '王克敏', '叔鲁', NULL, 1873, 1945, 'exact', 'exact', '浙江杭县（今余杭）', '["\\u738B\\u53D4\\u9C81"]', '["\\u4F2A\\u534E\\u5317\\u4E34\\u65F6\\u653F\\u5E9C\\u59D4\\u5458\\u957F","\\u534E\\u5317\\u5934\\u53F7\\u6C49\\u5978"]', '抗日战争时期', '华北伪临时政府 / 汪伪政权', '王克敏，字叔鲁，浙江杭县人，举人出身。清末留日。民国时期历任中国银行总裁、财政总长、北平政务委员会委员等职。1937年12月在日本扶植下于北平成立「中华民国临时政府」，任行政委员会委员长。1940年并入汪伪政权后，任「华北政务委员会」委员长。1945年8月日本投降后被捕，12月25日在北平狱中畏罪服毒自杀，年72岁。', '[]', '2026-08-23 12:23:35.111969', '2026-08-23 12:23:35.111969');
INSERT INTO `Traitors` (`Id`, `Name`, `CourtesyName`, `Pseudonym`, `BirthYear`, `DeathYear`, `BirthYearType`, `DeathYearType`, `NativePlace`, `AliasesJson`, `IdentityTagsJson`, `Period`, `Faction`, `Summary`, `RelatedIdsJson`, `CreatedAt`, `UpdatedAt`) VALUES ('1a5c0a4489ec4433931fd8a26d608e69', '梁鸿志', '众异', NULL, 1882, 1946, 'exact', 'exact', '福建长乐', '["\\u6881\\u4F17\\u5F02"]', '["\\u4F2A\\u7EF4\\u65B0\\u653F\\u5E9C\\u884C\\u653F\\u9662\\u957F","\\u534E\\u4E2D\\u5934\\u53F7\\u6C49\\u5978"]', '抗日战争时期', '南京伪维新政府 / 汪伪政权', '梁鸿志，字众异，福建长乐人。晚清巨儒梁章钜曾孙。1905年入京师大学堂。北洋时期任段祺瑞执政府秘书长。1938年3月在日本扶植下于南京成立「中华民国维新政府」，任行政院长。1940年并入汪伪，任监察院长、立法院长。1946年5月以汉奸罪被判死刑，11月9日在上海提篮桥监狱被执行枪决。', '[]', '2026-08-23 12:23:35.154927', '2026-08-23 12:23:35.154927');

-- Spouses (9 行)
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('cf67f6ebf8ea4b12beb784fff0dca9b6', '5cd9d2c429624c9190edc1a12b5a07da', '井上惠民（日本籍）', '日籍妻子');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('0b7911aa491f432fafb46f24046734ba', 'de2f04e471c34e19a14d8b72403fec6a', '陈璧君', '字冰如，号玉冰，广东新会人，南洋巨富陈耕基之女');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('9cc650d084e74c4b859f263fc51789ca', '947e029bf0874fde984f509d4bb0c70c', '李励庄', '中共早期党员，后随陈投敌，1949年后移居海外');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('7209f1ab06764cb29f03330b60e3f773', '8a997e9c473c4d02933ca468d493ca84', '杨淑慧', '上海富商之女，与周共患难');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('ac92a1266a364579a08c5a9aa4ea98cd', '8a997e9c473c4d02933ca468d493ca84', '筱玲红', '苏州名伶，周之色艺兼收');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('17666758d6144f488fed3d9895a4179a', 'ba4b4b594302468d8908433669e0f300', '陈舜贞', '陈璧君胞妹，汪精卫妻妹');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('ab09c8bef2744d73ada4140e7e6dec92', '96c2476c9fc648c58f17d4832e380681', '汪精卫', '1912年结婚');
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('19e54d24e1fc46b28d9ba599782e658e', 'dafd3a63886e4dd8b1d67f959a4c862a', '小老婆王某某', NULL);
INSERT INTO `Spouses` (`Id`, `TraitorId`, `Name`, `Remark`) VALUES ('8c6eca7e84b348b187bdff2c5a57252c', 'dafd3a63886e4dd8b1d67f959a4c862a', '王朱氏', NULL);

-- Children (13 行)
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('08fd57e8905a4693aa6cda6147cd7abd', 'de2f04e471c34e19a14d8b72403fec6a', '汪文彬', '女', '迁居台湾', '长女，后从事宗教活动');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('1d26b469242c49dbaea8f4c9ca930283', 'de2f04e471c34e19a14d8b72403fec6a', '汪文惺', '女', '移居美国', '三女');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('400b420559114b798f71b7710d580705', 'de2f04e471c34e19a14d8b72403fec6a', '汪文恂', '女', '迁居香港', '次女');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('61dca5ba69064184ad66a6eb1b63b1e7', 'de2f04e471c34e19a14d8b72403fec6a', '汪文婴', '男', '移居美国加州', '长子，曾在伪政权中任职');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('da687813e48a4ea0b3bbdf1f39bc5e62', 'de2f04e471c34e19a14d8b72403fec6a', '汪文悌', '男', '移居香港', '次子，从事桥梁建筑工程');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('80b1a5c068574709b1722bd4a8a497c2', '947e029bf0874fde984f509d4bb0c70c', '陈干', '男', '移居美国', NULL);
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('24cada5a65f14bc89db5a9ea0bdee3b2', '8a997e9c473c4d02933ca468d493ca84', '周慧海', '女', NULL, NULL);
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('abe9250c2dcb42f9a4a3549933c006c8', '8a997e9c473c4d02933ca468d493ca84', '周幼海', '男', '留居上海', '又名周之友，后加入中共');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('5b10ef9abfee47b0974db99052854bcd', '96c2476c9fc648c58f17d4832e380681', '汪文惺', '女', '美国', '三女');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('98b62aae6a09447a823dbfe42f1aaeb5', '96c2476c9fc648c58f17d4832e380681', '汪文悌', '男', '香港', '次子');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('cc22967f49c5448ca6b6af586b33c123', '96c2476c9fc648c58f17d4832e380681', '汪文婴', '男', '美国', '长子');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('f563d3a97d3b4723adace286092afc3e', '96c2476c9fc648c58f17d4832e380681', '汪文彬', '女', '台湾', '长女');
INSERT INTO `Children` (`Id`, `TraitorId`, `Name`, `Gender`, `Whereabouts`, `Remark`) VALUES ('fc56079a2ab2428794bb6c5d419778e6', '96c2476c9fc648c58f17d4832e380681', '汪文恂', '女', '香港', '次女');

-- Residences (17 行)
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('478d0596b5f1493bbf3120cd272fb3e0', '5cd9d2c429624c9190edc1a12b5a07da', '河北通县（今北京通州）', '1935-1938', '伪冀东防共自治政府所在地');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('608814b8ad4a45a480b78b4008ae8a7d', 'de2f04e471c34e19a14d8b72403fec6a', '广东广州', '1910年代', '早年在广州任职');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('aa86eb4428a34ad0a3dd654d73356cc5', 'de2f04e471c34e19a14d8b72403fec6a', '日本名古屋', '1944', '病逝于名古屋帝国大学附属医院');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('b4ee717fc6814c9d8993d4c7a2196b29', 'de2f04e471c34e19a14d8b72403fec6a', '上海愚园路1136弄31号', '1939-1940', '汪伪公馆（王伯群故居）');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('fb3d6e9cacf64e3dae36ddb6c1c5ec13', 'de2f04e471c34e19a14d8b72403fec6a', '江苏南京', '1940-1944', '伪国民政府所在地');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('34965c256b0a4744b7bf1ed8fd0c7659', '947e029bf0874fde984f509d4bb0c70c', '广州', '1920年代', '早年活动地');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('44da326f1acb45d8b2ab17d3b9685e33', '947e029bf0874fde984f509d4bb0c70c', '江苏南京', '1940-1945', '伪立法院院长官邸');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('71dca54df16142ff8b6f750d7877421c', '947e029bf0874fde984f509d4bb0c70c', '上海', '1943-1944', '兼任上海市市长');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('292cf647a89a4708a661d90a14c41683', '8a997e9c473c4d02933ca468d493ca84', '南京西康路18号', '1940-1945', '周佛海官邸');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('f55f561111a5464fa4b696bf0c26f5d2', '8a997e9c473c4d02933ca468d493ca84', '上海愚园路', '1939-1945', '上海居所');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('48366e9668e944a78cd027e379de1480', 'ba4b4b594302468d8908433669e0f300', '广州', '1944-1945', '任广东省省长时的官邸');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('a019e8d0a0a947ebb790060d7d5a350f', 'ba4b4b594302468d8908433669e0f300', '南京', '1940-1945', NULL);
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('00ab7e0a6db64efbab08f3ec51bbf84c', '96c2476c9fc648c58f17d4832e380681', '广州', '1944-1945', '与褚民谊共同主政广东');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('27d2b2f135a64992ac7c02a63fd87568', '96c2476c9fc648c58f17d4832e380681', '南京', '1940-1944', NULL);
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('25ab436ccfb6420588b39275147a8cbf', 'dafd3a63886e4dd8b1d67f959a4c862a', '北平（今北京）', '1937-1945', '伪临时政府所在地中南海怀仁堂旁');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('0cea5d83dab44195b6b8bfddeb8a6ad6', '1a5c0a4489ec4433931fd8a26d608e69', '南京', '1938-1940', '伪维新政府所在地');
INSERT INTO `Residences` (`Id`, `TraitorId`, `Place`, `Period`, `Remark`) VALUES ('d1ef92d35a27486f88cadf37f0a6b8f2', '1a5c0a4489ec4433931fd8a26d608e69', '上海', '1940-1945', NULL);

-- CrimeRecords (29 行)
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('5550632fe89648cebc20e3401feade43', '5cd9d2c429624c9190edc1a12b5a07da', 1936, '走私毒品，发行伪币冀东银行券', NULL, '日本以冀东为基地向华北大量倾销鸦片、海洛因，毒害中国人民', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('aa41bbc8f2784ce6b172896c00832776', '5cd9d2c429624c9190edc1a12b5a07da', 1935, '成立冀东防共自治政府公开脱离南京政府', '11月25日宣布冀东22县自治，任委员长，后改称主席', '中国历史上第一个公开的汉奸割据政权，华北危机达到高潮，直接触发一二九学生运动', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('b530446cf2bb4d378c48e072c611c8fc', '5cd9d2c429624c9190edc1a12b5a07da', 1937, '协助日军进犯华北，收编伪军协同作战', NULL, '七七事变后，冀东伪军、警为日军进攻北平、天津提供内应', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('20b3e3794dc74f77bc8b732f985de779', 'de2f04e471c34e19a14d8b72403fec6a', 1939, '与日本签订卖国密约《日支新关系调整纲要》', '与日本特务机关影佐祯昭秘密谈判，承认日本在华军事、政治、经济特权', '将中国主权彻底出卖，涵盖内蒙、华北、华中、华南广大区域', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('2aedc4bf753948968a8e463f7c18bd4e', 'de2f04e471c34e19a14d8b72403fec6a', 1943, '对英美宣战并签订《同盟条约》', '1943年1月9日对美英宣战，10月签订《汪日同盟条约》，彻底绑上日本战车', '使中国在国际外交上陷入被动，让日伪在「合法」名义下搜刮中国资源', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('45b8fd07b3b945a4b6f25a9cd98c816d', 'de2f04e471c34e19a14d8b72403fec6a', 1938, '发表「艳电」公开投靠日本', '1938年12月18日潜离重庆飞往昆明，再转河内；29日发表「艳电」响应近卫文麿三原则，公开投降日本', '对抗战军民士气造成巨大打击，国民党内部出现分裂', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('84ddff4962d24d319fb2b4f3b3705ea8', 'de2f04e471c34e19a14d8b72403fec6a', 1940, '在南京成立「中华民国国民政府」伪政权', '3月30日在南京宣誓就任「国民政府代主席」兼「行政院院长」，完全受日本「最高军事顾问」指挥', '在华中和华南建立起完整的日伪统治体系，协助日军维持治安、征发物资', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('85398a551d7e44be9c68989a8ab0c4d0', 'de2f04e471c34e19a14d8b72403fec6a', 1941, '建立伪军配合日军「清乡」「扫荡」', '收编地方杂牌军和土匪，组建伪和平建国军，配合日军对游击区进行扫荡', '造成新四军、抗日军民大量伤亡，根据地受严重破坏', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('40d0ab740bba4290ba91bfa14a6082ac', '947e029bf0874fde984f509d4bb0c70c', 1943, '任上海市市长兼警察局长', '对上海实施严厉管控，配合日军经济统制', '上海市民人身财产权利受严重侵害', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('6eaae01a07944b68bcad64677002be13', '947e029bf0874fde984f509d4bb0c70c', 1944, '继任伪国民政府代主席', '汪精卫病死日本后，以行政院长代理主席职权', '继续维持伪政权运转至日本投降', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('9cf94db791c644c0a2bda15927f0b8f0', '947e029bf0874fde984f509d4bb0c70c', 1940, '出任汪伪立法院长', '3月汪伪政府成立，任立法院长兼政治委员会委员', '在「宪政」名义下为日本统治合法性背书', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('f8e3f21433c348409881a35ef6e1cfc5', '947e029bf0874fde984f509d4bb0c70c', 1938, '追随汪精卫逃离重庆投敌', '与周佛海等人密谋，随汪精卫逃往河内', '国民党高层出现叛国浪潮', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('34408ab8913f411f982e071ec1c92304', '8a997e9c473c4d02933ca468d493ca84', 1942, '兼任伪警政部长、清乡委员会副委员长', '统管伪军警武装，执行「清乡」', '配合日军对苏浙皖根据地进行清剿', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('7408babe0205437fa2bd4fd1138dcc6d', '8a997e9c473c4d02933ca468d493ca84', 1941, '成立中央储备银行发行伪币中储券', '1月6日在南京成立伪中储行，以伪币收兑法币', '通过货币掠夺民间财富，造成沦陷区恶性通胀', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('960bc633be0141e7ba4c6d571a34585e', '8a997e9c473c4d02933ca468d493ca84', 1943, '推行全国「物价对策」和强制统购', '对米、棉、油、煤实行全面统制', '沦陷区百姓生活必需品短缺，大量人口陷入饥荒', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('d5aeb391fec64bf989081920d632bacb', '8a997e9c473c4d02933ca468d493ca84', 1939, '秘密签署《日华新关系调整要纲》', '与梅思平代表汪方签署卖国条约', '将中国主权以条约形式出卖', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('14a955e276a642868351176ca8469d22', 'ba4b4b594302468d8908433669e0f300', 1940, '任伪行政院秘书长，主持伪政府日常运作', NULL, NULL, NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('963adbb361744995a67153df1f7d4f54', 'ba4b4b594302468d8908433669e0f300', 1941, '任伪外交部长，与轴心国开展外交活动', '出使日本、德国、意大利等轴心国', '为日本在华侵略制造国际合法性', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('ef4a22f7b0284d039a1566aa4319b607', 'ba4b4b594302468d8908433669e0f300', 1944, '任广东省省长兼广州绥靖主任', NULL, '对广东沦陷区实施统治，搜刮战略物资', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('1750f8433b00427aa2ee5ae036971d9e', '96c2476c9fc648c58f17d4832e380681', 1938, '力主投敌，促成汪精卫「艳电」', '极力鼓动汪精卫，促成1938年12月逃往河内', '为汪精卫集团叛国提供关键推力', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('d02fb8e9c7664366ab77ee49a751a8e6', '96c2476c9fc648c58f17d4832e380681', 1939, '参与上海秘密谈判', '与日方影佐祯昭谈判，推动密约签署', NULL, NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('e433d5c07a0c45a49bc218d34563ff28', '96c2476c9fc648c58f17d4832e380681', 1944, '赴广东主持伪政', '汪精卫死后，以「指导」名义赴穗控制伪粤府', '广东沦陷区百姓受其直接统治迫害', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('27539194dd0248b8b579e924997f9968', 'dafd3a63886e4dd8b1d67f959a4c862a', 1939, '与日本签订《关于华北开发股份公司设立协定》', NULL, '将华北煤、铁、盐、棉花等战略资源全面交由日本掠夺', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('549692b7101748fd9cda8b79c15cad47', 'dafd3a63886e4dd8b1d67f959a4c862a', 1937, '在北平成立伪中华民国临时政府', '12月14日在北平居仁堂宣布成立伪临时政府，悬挂五色旗', '华北沦陷区出现第一个完整的汉奸傀儡政权', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('8f03bc04b9ac48e0a19f92a676c309ff', 'dafd3a63886e4dd8b1d67f959a4c862a', 1940, '并入汪伪后任华北政务委员会委员长', '3月取消临时政府，改设政务委员会保留高度自治', '华北继续作为日本「兵站基地」被深度剥削', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('dd5288414d3e4dda9ca46347d96ca0a8', 'dafd3a63886e4dd8b1d67f959a4c862a', 1938, '组建伪治安军配合日军「扫荡」', '与齐燮元组建伪华北治安军，总数达十万人', '协助日军镇压华北敌后抗日根据地，造成八路军大量伤亡', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('7b61746c7d1a48d9aa363958c10c0baf', '1a5c0a4489ec4433931fd8a26d608e69', 1940, '并入汪伪后任监察院院长、立法院院长', NULL, NULL, NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('845ac53191e6451cb64b86e4d8f2c692', '1a5c0a4489ec4433931fd8a26d608e69', 1938, '成立「华兴商业银行」发行伪华兴券', '在上海设立伪银行，发行伪钞', '扰乱华中金融秩序，掠夺民间财富', NULL);
INSERT INTO `CrimeRecords` (`Id`, `TraitorId`, `Year`, `Title`, `Process`, `Harm`, `SourceRef`) VALUES ('e8df554cf8634c69921fcd16d95d2b58', '1a5c0a4489ec4433931fd8a26d608e69', 1938, '在南京成立「中华民国维新政府」', '3月28日在南京成立伪维新政府，下辖苏浙皖三省及京沪两市', '华中出现独立汉奸政权，为日军搜刮长江三角洲资源', NULL);

-- LifeEvents (57 行)
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('902052f0d8f641bbaffc778d317684cc', '5cd9d2c429624c9190edc1a12b5a07da', 1927, '任南京国民政府驻日特派员', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('9cee7c23341e4da190c6ac69890692b6', '5cd9d2c429624c9190edc1a12b5a07da', 1935, '11月宣布成立冀东防共自治政府', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('b10451ed16ad4b4c8cabf8f9d1a8a426', '5cd9d2c429624c9190edc1a12b5a07da', 1947, '12月1日在南京被执行枪决，年62岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('b7df224ffd7b45c5bf7f1da811396d22', '5cd9d2c429624c9190edc1a12b5a07da', 1904, '官费留学日本，入早稻田大学经济科', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('d44af474270f45a18ae71e0153d6f74d', '5cd9d2c429624c9190edc1a12b5a07da', 1938, '并入王克敏伪临时政府', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('0bec7f561e8e4f208decac5050dd7e66', 'de2f04e471c34e19a14d8b72403fec6a', 1927, '发动「七一五」分共，镇压共产党员和革命群众', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('1107fdaafcb649cfba1c0adbb65108a2', 'de2f04e471c34e19a14d8b72403fec6a', 1905, '加入中国同盟会，参与起草章程，任评议部评议长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('35dde9f29beb4be8962380eb18150b8d', 'de2f04e471c34e19a14d8b72403fec6a', 1925, '孙中山逝世后，当选广州国民政府主席兼军事委员会主席', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('41c04b76d3c6407180da8a9f77b7ce43', 'de2f04e471c34e19a14d8b72403fec6a', 1903, '官费赴日本留学，入法政大学速成科', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('4bbe3d53b96843349f1c3faad3bce39e', 'de2f04e471c34e19a14d8b72403fec6a', 1935, '在国民党四届六中全会遇刺，枪伤遗留后患', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('62ab4395184347b39ef0a07b79c1bfea', 'de2f04e471c34e19a14d8b72403fec6a', 1938, '经河内转上海，公开投敌，发表「艳电」', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('8c113150d61d412c9c0080d4c6351da4', 'de2f04e471c34e19a14d8b72403fec6a', 1910, '赴北京谋刺摄政王载沣，事败被捕，被判处终身监禁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('a5144ec624034be8844ecb480ee7fd54', 'de2f04e471c34e19a14d8b72403fec6a', 1911, '武昌起义后出狱，任南方和议参赞，参与南北和谈', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('a7a66dc62a02427d965e551d24d9a1e2', 'de2f04e471c34e19a14d8b72403fec6a', 1944, '11月10日于日本名古屋病逝，年61岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('ace50d4aca92429c938abbab6c33c51b', 'de2f04e471c34e19a14d8b72403fec6a', 1940, '在南京成立伪国民政府，任代主席、行政院长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('28d1e4bab87446be9025622e64cdbc42', '947e029bf0874fde984f509d4bb0c70c', 1921, '以广州代表身份出席中共一大', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('478a91b15d364235aa80f5171ee4c6af', '947e029bf0874fde984f509d4bb0c70c', 1920, '北京大学哲学系毕业', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('4c0afa3c4e7042f68038dbf465722e9f', '947e029bf0874fde984f509d4bb0c70c', 1922, '退出共产党，赴美入哥伦比亚大学攻读经济学硕士', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('853586e0941940b28d9cbdf01f90844d', '947e029bf0874fde984f509d4bb0c70c', 1938, '随汪投敌', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('a5f5fb6d28184ae1aca4358cc0001a02', '947e029bf0874fde984f509d4bb0c70c', 1917, '入广州法政专门学校学习', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('a99294b3ded14e8a98a68f442c07add5', '947e029bf0874fde984f509d4bb0c70c', 1946, '6月3日在苏州狮子口监狱被执行枪决，年54岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('b589ac009f324176bc89a1925c8d68d5', '947e029bf0874fde984f509d4bb0c70c', 1928, '与汪精卫发起「国民党改组同志会」', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('f015009b3e7e4fb084d020f4cfabe381', '947e029bf0874fde984f509d4bb0c70c', 1940, '出任汪伪立法院长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('1706a0fb618b4d05a845d5867ccb12e6', '8a997e9c473c4d02933ca468d493ca84', 1946, '被南京高等法院以汉奸罪判处死刑', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('1b2a7f3f016245d794a5def500b15a87', '8a997e9c473c4d02933ca468d493ca84', 1937, '任蒋介石侍从室秘书，对抗战持悲观态度', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('2a142cee4b064d53ac385ebb5eb8bead', '8a997e9c473c4d02933ca468d493ca84', 1948, '2月28日病逝于南京老虎桥监狱，年51岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('7ee4265adfcf48039b2c1e9cac81e087', '8a997e9c473c4d02933ca468d493ca84', 1917, '赴日本鹿儿岛第七高等学校留学', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('98170cd8e2d04fafa52303edf6e44145', '8a997e9c473c4d02933ca468d493ca84', 1938, '随汪精卫投敌', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('bfb1d25644d241708fc71f3b999dfea8', '8a997e9c473c4d02933ca468d493ca84', 1947, '国民政府主席蒋介石特赦，改判无期徒刑', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('c253534e00a14e1da7e798e9928ea106', '8a997e9c473c4d02933ca468d493ca84', 1921, '代表旅日共产主义小组出席中共一大', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('c9f8d87277ad40359b34c968055d7de2', '8a997e9c473c4d02933ca468d493ca84', 1941, '伪中储行成立，兼任总裁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('da8055b9bf164e11b7a79bfb0c88eeb7', '8a997e9c473c4d02933ca468d493ca84', 1924, '退出中共，加入国民党', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('2a78014b8ba14a1881a18033cf6c193d', 'ba4b4b594302468d8908433669e0f300', 1921, '在法国斯特拉斯堡大学获医学博士学位', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('5487001f39b0467c881e5160137f8af3', 'ba4b4b594302468d8908433669e0f300', 1912, '与陈舜贞结婚，同赴比利时留学', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('61c2181ca332434fa10774db2035e9f5', 'ba4b4b594302468d8908433669e0f300', 1940, '汪伪成立后任行政院秘书长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('8244f287fcb1405fa43370754f6b3acf', 'ba4b4b594302468d8908433669e0f300', 1906, '东渡日本留学，加入同盟会', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('96ab399c2411485a816d574020eb11ec', 'ba4b4b594302468d8908433669e0f300', 1946, '8月23日在苏州被执行枪决，年62岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('c009cbc376f2464c9f6e04c15abfa85d', 'ba4b4b594302468d8908433669e0f300', 1932, '任国民政府行政院秘书长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('0e7dbbc26f824e8e806bf39665849c30', '96c2476c9fc648c58f17d4832e380681', 1908, '在槟城见汪精卫演说，倾心并资助革命', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('50b05906e6ad411cb1000b8d0ece0736', '96c2476c9fc648c58f17d4832e380681', 1946, '4月22日江苏高等法院判处无期徒刑', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('757bde710ccb467ab9abafb32ec3f587', '96c2476c9fc648c58f17d4832e380681', 1910, '赴北京，参与谋刺摄政王行动的后勤准备', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('a8745dad10694a869d3b54e69991c788', '96c2476c9fc648c58f17d4832e380681', 1945, '9月在广州被军统诱捕', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('b011ede002e0429f8cd013c123a3de57', '96c2476c9fc648c58f17d4832e380681', 1912, '与汪精卫在上海结婚', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('e74da6c247a74895963e29a210d857d3', '96c2476c9fc648c58f17d4832e380681', 1949, '新中国建立后拒绝宋庆龄何香凝的保释劝告', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('fc389ffec1bb435eb6f9ec3a33ee330c', '96c2476c9fc648c58f17d4832e380681', 1959, '6月17日病死于上海提篮桥监狱', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('1b1e3e447c714b0dbcccd1e9ca4594f2', 'dafd3a63886e4dd8b1d67f959a4c862a', 1918, '任财政总长，兼盐务署督办', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('424ef8ad1aca477d9fb1304e1e9c67b3', 'dafd3a63886e4dd8b1d67f959a4c862a', 1935, '任冀察政务委员会委员', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('73a48083a4264a168e9e664ea2ee35b3', 'dafd3a63886e4dd8b1d67f959a4c862a', 1940, '改任汪伪华北政务委员会委员长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('9310768149db4cbf80a709f557c99e96', 'dafd3a63886e4dd8b1d67f959a4c862a', 1907, '任留日学生监督', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('9455b788d22443b8be81c65247466e3e', 'dafd3a63886e4dd8b1d67f959a4c862a', 1901, '清政府派为驻日公使馆参赞', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('bf8377cb06814e8294a668fd695fda04', 'dafd3a63886e4dd8b1d67f959a4c862a', 1937, '12月在北平组织伪中华民国临时政府', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('c21a349cf1dc40ff80f1247a29aebad1', 'dafd3a63886e4dd8b1d67f959a4c862a', 1945, '12月25日在北平炮局胡同陆军监狱服氰化钾自杀', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('c2b405bcac304fdeb38bf89a8cac866e', 'dafd3a63886e4dd8b1d67f959a4c862a', 1917, '任段祺瑞政府中国银行总裁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('3e17e12019da46e4a2e6c9964d2fd48a', '1a5c0a4489ec4433931fd8a26d608e69', 1905, '入京师大学堂', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('addceb35aaa84e07bb7fd816d2cba0fb', '1a5c0a4489ec4433931fd8a26d608e69', 1946, '5月上海高等法院判处死刑，11月9日执行枪决，年64岁', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('cfca181e21f44b08828ce3b29206115f', '1a5c0a4489ec4433931fd8a26d608e69', 1925, '任段祺瑞执政府秘书长', NULL);
INSERT INTO `LifeEvents` (`Id`, `TraitorId`, `Year`, `Event`, `SourceRef`) VALUES ('fcbaae12eba248de95f148971a086f42', '1a5c0a4489ec4433931fd8a26d608e69', 1938, '3月成立伪维新政府', NULL);

-- Attachments: 无数据

-- Sources (8 行)
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('3d136f6197d94d73802e0215bd41f980', 'de2f04e471c34e19a14d8b72403fec6a', '《汪兆铭档案史料汇编》，国史馆，2000', 5);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('82a1f9bd30fe4e019aa23952e1376a6c', 'de2f04e471c34e19a14d8b72403fec6a', '黄美真《汪精卫集团投敌》，上海人民出版社，1984', 4);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('880824a7ca3b488487ed47a223e8baf3', 'de2f04e471c34e19a14d8b72403fec6a', '蔡德金《历史的怪胎——汪精卫国民政府》，广西师范大学出版社', 5);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('d5254b320906441caf278e23b253f1f3', '947e029bf0874fde984f509d4bb0c70c', '《审讯汪伪汉奸笔录》，江苏古籍出版社，1992', 5);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('27cd0b04e5f4415daa6ddfcd581a5989', '8a997e9c473c4d02933ca468d493ca84', '《周佛海日记》，中国社会科学出版社，1986', 5);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('99a9c16e18b941fe8a055999b62eef87', '8a997e9c473c4d02933ca468d493ca84', '蔡德金、王升《周佛海日记全编》，中国文联出版社，2003', 5);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('5c3a67875c5d427cac9337bb60e19128', '96c2476c9fc648c58f17d4832e380681', '《陈璧君与汪精卫》，团结出版社，2004', 3);
INSERT INTO `Sources` (`Id`, `TraitorId`, `Citation`, `Credibility`) VALUES ('1d9f56ba644d4af1bead542e801f9763', 'dafd3a63886e4dd8b1d67f959a4c862a', '《日伪政权统治下的华北》，天津人民出版社，2001', 4);

-- Revisions: 无数据

SET FOREIGN_KEY_CHECKS = 1;