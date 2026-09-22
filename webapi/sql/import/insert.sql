
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('1cdc5e7dfe9d4eb5b8df08085ed474a0','admin','admin@hanjiannet.local','$2a$11$cRIk2CQ3BqWZTq7CHHx2w.5zY1bOFQRLu8ItxpKlMwYfwu6Ng9T4a','superadmin','2026-08-23 11:24:42.743415','/uploads/d92cddfb79a94169b9b60cafae16d8fe.jpg',null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('3fd874ddbefb42a7ba0e087e7a83a5ef','testuser','testuser@hanjiannet.local','$2a$11$dBuyO1RUUXiheRS70jIL1uGMaLnXSXFAV1oo9zxcLFMqU51iGfpj6','user','2026-08-23 11:24:43.769432',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('4b1e6d3870e248f98aa608b3e8ef2fcd','admin2','admin2@test.local','$2a$11$Ku38rJb21ygL33h9IYp6z.A6GypoXsCd5RXygubjDVzTaFlgrrAo.','admin','2026-08-23 12:12:16.708920',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('5268e40985094514810f3df61512d8d1','testadmin','testadmin@hanjiannet.local','$2a$11$I.Swne.sc8.aO6xBtrBWlehDI.t4ExiblDUznUOt5kYDew2yPG4hG','admin','2026-08-23 11:24:43.134033',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('56c9628b134c4244801b6f00f39ef07f','rbac_test','rbac_test@hanjiannet.local','$2a$11$dSWuyL/MeD3IxyvE4lgHmOA1pROiPgHzssBo9XydUxjPoTr69El.S','user','2026-08-23 12:04:28.447055',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('587500bb6cae4dfcafe593281c46bd4c','testmanager','testmanager@hanjiannet.local','$2a$11$xVJNWaWniG3MlUQK7gMiKOJKMc3XPteY0VrK5yoSMiXQrvkdaN9PG','manager','2026-08-23 11:24:43.457045',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('5fe1d43cc95b443a9b926cbe578ed863','user11','user@163.com','$2a$11$zgt.dg4KRNq.e.lzrpeSHehomOfq4WmTmYhVTMhiThpheJoJ90wce','user','2026-08-28 06:53:17.596198',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('8b32f4388a9a4e5e9446cbd25b1d90b7','testguest','testguest@hanjiannet.local','$2a$11$dfIk8W4QJ/4VUecQ67dyj.hiq.CdNjOlebe3FowO55UuOn3uPJm4K','guest','2026-08-23 11:24:44.078344',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('9fac5edb65ae476d877eec36ab9d60fc','17545545441','3112203373@qq.com','$2a$11$pyNKa/MooCKYFg4ayzQdXOMCRBEXwV8U9vYF9ueG.cWwZZATAie5y','user','2026-09-03 06:53:55.934555',null,null,null,null,null,null,null,null);
INSERT INTO `users` (`Id`, `Username`, `Email`, `PasswordHash`, `Role`, `CreatedAt`, `AvatarUrl`, `Gender`, `Birthday`, `Address`, `Phone`, `Nickname`, `Signature`, `Region`) VALUES ('a260a2de551d4e9e844ab37f26a83984','user1','website@163.com','$2a$11$Db.wpeDJgmzBZC3./3WgSuhzVQ08t6dQTGKmVIi4rWElfPTMeTth6','user','2026-08-26 10:31:45.067159',null,null,null,null,null,null,null,null);


INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('6f44bd87f1cd492db94fe38bf93f7722','contact','/contact','联系我','8','1','2026-09-21 01:43:11.424711',null);
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm01','home','/','首页','1','1','2026-08-25 00:00:00.000000','2026-08-26 13:39:07.064388');
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm02','lookup','/lookup','查询','2','1','2026-08-25 00:00:00.000000',null);
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm03','map','/map','汉奸地图','3','1','2026-08-25 00:00:00.000000','2026-08-26 09:03:07.912926');
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm04','timeline','/timeline','时光轴','4','0','2026-08-25 00:00:00.000000','2026-09-11 09:38:07.565648');
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm05','roster','/roster','名录','5','0','2026-08-25 00:00:00.000000','2026-09-16 14:31:38.657097');
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm06','events','/events','事件','6','1','2026-08-25 00:00:00.000000','2026-09-11 07:20:31.326639');
INSERT INTO `webmenus` (`Id`, `Key`, `Path`, `Label`, `Sort`, `IsEnabled`, `CreatedAt`, `UpdatedAt`) VALUES ('wm07','about','/about','关于','7','1','2026-08-25 00:00:00.000000',null);



INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('02a525ef8f5e4e239f2b827f6e008634','system-logs','/system-logs','系统日志',null,'5',null,'2026-08-28 05:35:02.419910');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('0773995abd53454abed7fe76f483bc4c','logs-operation','/logs/operation','操作日志',null,'2','system-logs','2026-08-28 05:35:02.986389');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('0cbdafbe2d214dff89f33bf6e873504e','roles','/roles','角色管理',null,'2','system','2026-08-23 11:24:42.624454');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('183a238a7d0445d4940eadc77331c64b','dashboard','/dashboard','数据看板',null,'0',null,'2026-09-16 14:15:19.650991');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('266b4c052fd54f19932e43f6e14f2555','events','/events','事件管理',null,'4',null,'2026-09-11 12:28:48.028639');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('39862e515a2749a39408b583f7b6740a','reviews','/reviews','待审队列',null,'2',null,'2026-08-23 11:24:42.623541');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('3cfb01bce15041c69d888b43a7c6334b','menus','/menus','菜单管理',null,'3','system','2026-08-23 11:24:42.624724');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('582aa55c3b014a4d8085b5c111b1c73c','system','/system','系统管理',null,'3',null,'2026-08-23 11:24:42.623891');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('810bc0962156431288e8eb9d34b5ed26','logs-login','/logs/login','登录日志',null,'1','system-logs','2026-08-28 05:35:02.899407');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('98c32a7766cb4fd2b2200b95040c5bd5','users','/users','用户管理',null,'1','system','2026-08-23 11:24:42.624169');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6','web-menus','/web-menus','前台菜单',null,'4','system','2026-08-25 00:00:00.000000');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('c5d11e8150fe4921ae716fd9d1c9f8a3','logs-error','/logs/error','错误日志',null,'4','system-logs','2026-08-28 05:35:03.140330');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('c8e7ac948a12441aaf57a85016ee28d0','edit-traitor','/traitors/basic-edit','基本信息编辑',null,'2','traitors','2026-09-11 02:02:58.830561');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('c9c44e65ea7844c296b6fa987d20395a','merge-traitors','/traitors/merge','数据合并',null,'3','traitors','2026-09-10 06:44:14.314748');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('cdd4a491aca94ca9a017676cc2eee7f4','contact-messages','/contact-messages','联系留言',null,'5',null,'2026-09-21 01:43:10.712962');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('dd450d2d3cd44c3ebbf0a2819389dd89','profile','/profile','个人信息',null,'5','system','2026-08-23 11:24:42.624971');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('df45fa5edab34f2e96e0aacf5bff3d96','system-config','/settings','系统配置',null,'6','system','2026-09-16 04:31:12.363308');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('f6c9b70f8c014f3d806822f11f83c19b','traitors','/traitors1','信息管理',null,'1',null,'2026-08-23 11:24:42.598189');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('f7e06ac6bac44ff1867916d0c502b7e8','logs-query','/logs/query','查询日志',null,'3','system-logs','2026-08-28 05:35:03.059404');
INSERT INTO `menuitems` (`Id`, `Key`, `Path`, `Label`, `Icon`, `Sort`, `Parent`, `CreatedAt`) VALUES ('sadasdasd1123323123123123','traitors-list','/traitors/list','名录管理',null,'1',null,'2026-08-28 05:35:03.596200');


INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('1983b34d4cb64f8ab745062ca0b3ed61','merge-traitors','数据合并','menu','2026-09-10 06:44:15.038182');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('32a60199a42b44538f0949bb35fbf80c','system-logs','系统日志','menu','2026-08-28 05:35:03.427474');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('3ca8cda6805247728f268c1352c0095a','traitors-list','名录管理','menu','2026-09-12 06:59:02.529327');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('4b95c918a1a6405f80f4503be04dc3a5','events','事件管理','menu','2026-09-11 12:28:48.547185');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('4cc8284d1ec94520a7738052706dc6f8','profile','个人信息','menu','2026-08-23 11:24:42.668980');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('5376a6fef7ad43539b29e9335d416d8d','logs-operation','操作日志','menu','2026-08-28 05:35:03.427854');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('5998e12cd39e4426b8670322e52278e6','roles','角色管理','menu','2026-08-23 11:24:42.661372');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('7f9d86efed704b52ab119e90a74ff788','edit-traitor','基本信息编辑','menu','2026-09-11 02:03:01.138463');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('8df50fbefa664c8b8d01294d25510330','menus','菜单管理','menu','2026-08-23 11:24:42.668941');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('949d3499751b47cfbbc4fda85ea21e46','users','用户管理','menu','2026-08-23 11:24:42.668969');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('97fc0a0e98ff462580febea7c2e3fdc0','logs-query','查询日志','menu','2026-08-28 05:35:03.427907');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('ae783ff2f74a41e38fbd085f19d5d116','dashboard','数据看板','menu','2026-09-16 14:15:20.324175');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7','web-menus','前台菜单','menu','2026-08-25 00:00:00.000000');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('bef8b99fc3074f118c2f8e023492c560','system-config','系统配置','menu','2026-09-16 04:31:12.585084');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('cfd256b9ac894e78bea78385e3914187','logs-login','登录日志','menu','2026-08-28 05:35:03.427893');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('d4603c86274b4c598d33968daa2e3d69','logs-error','错误日志','menu','2026-08-28 05:35:03.427901');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('d6d500629f854eeba59422b5fde8db89','traitors','信息管理','menu','2026-08-23 11:24:42.668989');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('db9673e9f00848e895db8a9eadf0f560','system','系统管理','menu','2026-08-23 11:24:42.668957');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('dc6065026bf440beb7ad8a865996da21','contact-messages','联系留言','menu','2026-09-21 01:43:11.312524');
INSERT INTO `permissions` (`Id`, `Key`, `Name`, `Group`, `CreatedAt`) VALUES ('deb91df4286840179dea6ea6dc00e1c9','reviews','待审队列','menu','2026-08-23 11:24:42.668826');



INSERT INTO `roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('3863bc21de8c4c2c95d005e5376642b9','guest','游客','仅查看公开档案','0','1','2026-08-23 11:24:42.145459');
INSERT INTO `roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('43c94ad5b840471db369fa7279122d58','user','普通用户','提交修订，查看档案','1','1','2026-08-23 11:24:42.145459');
INSERT INTO `roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('6d75cb9d8b7c4c14883b7ac25470b71c','manager','管理','审核修订，可编辑档案','2','1','2026-08-23 11:24:42.145459');
INSERT INTO `roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('7f716519c70345a2b6fc5362a89b45a6','admin','管理员','系统管理，含用户/角色/菜单管理','3','1','2026-08-23 11:24:42.145458');
INSERT INTO `roles` (`Id`, `Key`, `Name`, `Description`, `Sort`, `IsBuiltIn`, `CreatedAt`) VALUES ('802c0cfbbe2949b2b0619c9ebdb34015','superadmin','超级管理员','拥有全部权限，不可删除','4','1','2026-08-23 11:24:42.145338');



INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('00869330caa343488fdde7af6af5a6c1','user','profile','2026-08-23 12:11:27.260145');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('0836b0b8ce4e42239e5a8ef77901d6c7','admin','traitors','2026-08-23 11:24:42.700923');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('153cf80c80734f3882a185e235c97457','superadmin','logs-error','2026-08-28 05:35:03.591676');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('18e154218150426d844b98b58848cdc4','superadmin','edit-traitor','2026-09-11 02:03:01.553588');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('1f19511ade684dfc9812276dda760f8b','superadmin','menus','2026-08-23 11:24:42.700831');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('285cc3001ef443f2aed3e379df6fead3','admin','dashboard','2026-09-16 14:15:20.397528');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('2a503a827ff9403f9012023530cf0c6e','superadmin','contact-messages','2026-09-21 01:43:11.388951');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('2f760a60912c44428ce9560b42abdc22','admin','system-logs','2026-08-28 05:35:03.591295');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('30141575ca624d97b3d0c024851fee72','admin','logs-login','2026-08-28 05:35:03.591663');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('369bc71406794ec5bd018522192363b6','manager','profile','2026-08-28 09:55:00.080647');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('3bd65c72b1ef4923acfba2487300704e','manager','logs-login','2026-08-28 09:55:00.080827');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('3cd2e4132c9941ae8e611976282d7729','superadmin','system-logs','2026-08-28 05:35:03.591631');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('3e223807f8194624bd0a915c445087af','admin','menus','2026-08-23 11:24:42.700822');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('4968ec7fe4dc4adbb124499dc0dcbe1a','superadmin','system','2026-08-23 11:24:42.700860');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('511f9063b6d84fcfba2c4d87201faa40','admin','merge-traitors','2026-09-10 06:44:15.130309');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('55893d501d304c5889b020633ade3be1','manager','system','2026-08-28 09:55:00.080800');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('5d1d0bea971943128352fa6dd98a545f','superadmin','traitors-list','2026-09-12 06:59:02.725004');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('6c218d2025414f56bdce60ced6f9405e','superadmin','merge-traitors','2026-09-10 06:44:15.131098');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('70394de4ea564d3d99bc21b60b843528','admin','events','2026-09-11 12:28:48.617741');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('74424876807341aebaed3300a8b48a3c','superadmin','dashboard','2026-09-16 14:15:20.398212');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7d70489b099f450d8e8dfcc7496211a9','admin','users','2026-08-23 11:24:42.700875');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7dbb329c398942f0ab800f9f9f523eb7','superadmin','roles','2026-08-23 11:24:42.700699');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('7de7412bee1a462f8dd6be9e366a805a','superadmin','reviews','2026-08-23 11:24:42.700811');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('80b60e99b8c74d498f177270f2673db1','admin','logs-query','2026-08-28 05:35:03.591681');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('87adcedb04db41ad8bd5a7ce86cec2eb','admin','contact-messages','2026-09-21 01:43:11.388625');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('8bb661d1fd1046f6aefa9bef8e541b80','admin','system-config','2026-09-16 04:31:12.682570');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('9224e95ce1034c368e7788502d126de2','superadmin','system-config','2026-09-16 04:31:12.683403');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('9c36b859be3e49fbba602d1a98a47eaf','superadmin','profile','2026-08-23 11:24:42.700913');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('a26d5cda57964affab3490ec7f6a3213','admin','edit-traitor','2026-09-11 02:03:01.552256');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('a8a07b7c7d7041a287c2e2799e51b4d7','superadmin','users','2026-08-23 11:24:42.700886');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('ac639381b3644944bded28276d710ca2','admin','roles','2026-08-23 11:24:42.694827');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('b62102467c9447d2be078beb64c5ef34','superadmin','traitors','2026-08-23 11:24:42.700932');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('b6e04ea6631e47c7ae16613e67015ace','admin','reviews','2026-08-23 11:24:42.700754');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('b82fc8ff8ce94f9792bcd4989e7ca04e','superadmin','events','2026-09-11 12:28:48.618669');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('bf13aa8b514e428bbb6a1903f5f7dd41','admin','system','2026-08-23 11:24:42.700851');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c1ec830156914af78c8972b8ae07540e','superadmin','logs-query','2026-08-28 05:35:03.591684');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8','admin','web-menus','2026-08-25 00:00:00.000000');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c48aaf753ca54a0da57f07dcc56d3c7b','admin','profile','2026-08-23 11:24:42.700904');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('c8ee289eff034a6baa9f84a4a4032dc3','superadmin','logs-login','2026-08-28 05:35:03.591666');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('ca80fc995ce5454ca8e17b6e823f2afc','admin','logs-operation','2026-08-28 05:35:03.591643');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9','superadmin','web-menus','2026-08-25 00:00:00.000000');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('e141e362d3b648d2b27c5b116f29b20f','admin','traitors-list','2026-09-12 06:59:02.724070');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('e17669ba0dbf4a6fbaf825939d7a952c','superadmin','logs-operation','2026-08-28 05:35:03.591648');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('eabf1d3b21f14642ba29e7c6fdac21c0','guest','profile','2026-08-28 09:54:32.468027');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('f7283ee1645043219986e49578cf2214','manager','reviews','2026-08-28 09:55:00.080809');
INSERT INTO `rolepermissions` (`Id`, `RoleKey`, `PermissionKey`, `CreatedAt`) VALUES ('f8a05da146e84cc6a0ef67f5619409e3','admin','logs-error','2026-08-28 05:35:03.591673');


INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('22dd7e2966214b938139f6441a427ed5','web.home.pageSize','10','web','Web 首页每页条数','2026-09-16 04:31:13','2026-09-16 07:00:41');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('4ba8b21e501e4eb6b9926d39d06a38c6','web.roster.pageSize','10','web','Web 名录每页条数','2026-09-16 04:31:13','2026-09-16 07:00:47');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('8a5f39a935a04716b6e5991336c807cf','web.admin.traitors.pageSize','20','web','Admin 名录每页条数','2026-09-16 06:38:18','2026-09-16 13:36:33');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('ad1732be593843c3bbf5023cb3e176da','web.lookup.pageSize','10','web','Web 查询每页条数','2026-09-16 04:31:13','2026-09-16 07:00:56');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('cf1e545f1f874f66ae20d42ba3f00cf2','web.home.cardShowPhoto','true','web','Web 首页汉奸卡片是否展示照片（true/false）','2026-09-16 13:39:17','2026-09-16 13:59:54');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('d256bdc4fc4b4e2c8d6d8f0eb02d1546','web.admin.traitors.showAvatar','false','web','Admin 名录管理页是否展示头像（true/false）','2026-09-16 13:39:17','2026-09-16 13:55:43');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('d786a7b3eff945a7927571e414d5b25d','web.roster.showAvatar','false','web','Web 名录页是否展示头像（true/false）','2026-09-16 13:39:17','2026-09-16 13:55:45');
INSERT INTO `systemconfigs` (`Id`, `Key`, `Value`, `Category`, `Description`, `CreatedAt`, `UpdatedAt`) VALUES ('ec48779d84504207895160728d468c2d','web.api.encryptionEnabled','true','web','Web/Admin 前端与 WebApi 通讯是否启用加密（true/false，需前后端密钥一致）','2026-09-17 03:01:00','2026-09-17 03:16:55');

