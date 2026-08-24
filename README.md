# 汉奸档案 · HanJianNet

近代汉奸档案史册平台（Web 公众站 + 后台管理 + Flutter 移动端 App）。公众可检索浏览，注册用户可提交档案（生卒、籍贯、配偶、子女、居住地、犯罪记录、照片、罪证），提交经后台审核后发布，档案支持完整修改历史溯源（修改人 / 修改时间 / 修改内容 / 审核人 / 审核日期 / 审核结果）。

## 技术栈

- 公众站 `Web`：React 18 + Vite + Tailwind CSS + React Router + Zustand + TypeScript
- 后台 `Admin`：React 18 + Vite + Tailwind CSS + TypeScript（独立应用）
- 移动端 `MobileApp`：Flutter（Android / iOS）
- 后端 `WebApi`：ASP.NET Core（.NET 8）+ Entity Framework Core + SQLite
- 鉴权：JWT Bearer + BCrypt，**五级 RBAC（基于数据库角色表 + 权限表 + 菜单表 + 角色-权限关联表）**
- 文件上传：API 内置静态文件服务（`/uploads`，照片 / 罪证）
- 跨域：API 端 CORS 白名单（默认放行 5173 / 5174 开发端口）

## 仓库结构（四个完全独立的子项目）

```
Admin/      后台管理系统（登录/动态菜单/待审队列/审核详情/用户管理/角色管理/菜单管理/个人信息）
Web/        公众网站（首页/详情/关于/登录注册/提交/编辑/个人中心）
MobileApp/  移动端 App（Flutter：浏览/检索/详情/登录）
WebApi/     ASP.NET Core Web API（唯一后端，含 EF Core 与 uploads/）
```

四个子项目完全独立：各自维护依赖、脚本与类型定义，无共享包，仅通过 REST API（JWT）通信。

## 快速开始

```bash
# 1. 启动后端 API（先跑，三个客户端都要请求它）
cd WebApi
dotnet run                # http://localhost:3000
# 首次启动自动建库并播种超级管理员：admin / admin123456

# 2. 公众网站
cd Web && npm install && npm run dev      # http://localhost:5173

# 3. 后台管理
cd Admin && npm install && npm run dev    # http://localhost:5174

# 4. 移动端 App（需 Flutter SDK）
cd MobileApp && flutter run
```

访问入口：公众站 <http://localhost:5173/> ，后台 <http://localhost:5174/> ，API <http://localhost:3000/> 。

## API 地址配置

前端通过 `.env` 中的 `VITE_API_URL` 配置 API 地址，默认直连 `http://localhost:3000`：

```bash
# Web/.env 与 Admin/.env
VITE_API_URL=http://localhost:3000
```

修改后重启 `npm run dev` 生效。附件（照片/罪证）等相对路径 `/uploads/...` 会自动解析为该地址。

## 角色与权限

| 角色 | 标识 | 层级 | 权限 |
| ---- | ---- | ---- | ---- |
| 超级管理员 | `superadmin` | 4 | 全部权限 + 用户管理（可创建任意低级角色、修改/删除任意低级账号） |
| 管理员 | `admin` | 3 | 审核档案 + 查看用户列表 + 管理 manager 及以下账号 |
| 管理 | `manager` | 2 | 进入后台，审核待审队列（通过 / 驳回） |
| 普通用户 | `user` | 1 | 公众站提交档案、上传附件、查看自己的提交 |
| 游客 | `guest` | 0 | 仅浏览公开内容 |

规则：不能操作自己的账号；只能操作层级低于自己的账号；不能授予不低于自己的角色。首次启动自动播种超级管理员（`admin / admin123456`），旧库中已有的 `admin` 角色账号会自动升级为 `superadmin`。

## 账号清单（含密码）

| 用途 | 用户名 | 密码 | 角色 | 说明 |
| ---- | ---- | ---- | ---- | ---- |
| 超级管理员（种子内置） | `admin` | `admin123456` | superadmin（4） | 首次启动自动播种，拥有全部权限 |
| 管理员（测试越级用） | `admin2` | `Admin2_123456` | admin（3） | 管理 user/manager 及以下，无权创建 superadmin |
| RBAC 普通用户测试账号 | `rbac_test` | `Test123456` | user（1） | 用于验证菜单拦截和授权后可见逻辑 |
| 公众注册（自行注册） | 任意 | 自定 | user（1） | 通过 `/api/auth/register` 注册 |

> **RBAC 验证闭环**：以 `rbac_test` 登录 → 空权限 → 菜单=0 个（拦截生效）→ 管理员在角色管理为 `user` 角色授予 `traitors / reviews / profile` 三个菜单 → 重新登录 → 三个菜单全部可见 → 再撤销 `traitors / reviews` → 仅 `profile` 可见。

## 后台菜单 / RBAC 体系

权限完全由**数据库四张表**驱动，不再硬编码：

| 表 | 说明 | 关键字段 |
| ---- | ---- | ---- |
| `Roles` | 角色定义（内置 5 级） | `Key`（superadmin/admin/manager/user/guest）, `Sort`（层级）, `IsBuiltIn` |
| `Permissions` | 权限定义，与菜单一一对应 | `Key`（=菜单 Key）, `Name`, `Group` |
| `MenuItems` | 菜单结构树（父子、排序、路径） | `Key`, `Path`, `Label`, `Sort`, `ParentKey` |
| `RolePermissions` | 角色 × 权限 多对多关联表 | `RoleKey`, `PermissionKey` |

**菜单过滤三态逻辑**（`GET /api/admin/menus`）：
- 🔴 **superadmin（Sort=4）**：无论 RolePermissions 有无关联，**始终返回全部菜单**
- 🟡 **admin/manager（Sort=2,3）**：RolePermissions 为空时**返回内置兜底菜单**（待审队列 + 个人信息）
- 🟢 **普通 user（Sort=1）**：RolePermissions 为空时**返回 0 个菜单**（严格拦截，不漏权限）

管理员可在 **角色管理** 页面为任意角色授予/撤销任意菜单（实际操作 `RolePermissions` 表），前端下次拉菜单即生效。

默认内置菜单（DbSeeder 首次播种）：

| 菜单 Key | 路径 | 分组 | 默认授予角色 |
| ---- | ---- | ---- | ---- |
| `dashboard` | `/dashboard` | - | superadmin |
| `traitors` | `/traitors` | - | superadmin |
| `reviews` | `/reviews` | - | admin / manager |
| `users` | `/users` | 系统管理 | superadmin / admin |
| `roles` | `/roles` | 系统管理 | superadmin / admin |
| `menus` | `/menus` | 系统管理 | superadmin / admin |
| `profile` | `/profile` | 系统管理 | admin / manager |

## 常用命令

| 子项目    | 命令                  | 说明          |
| --------- | --------------------- | ------------- |
| WebApi    | `dotnet run`          | 启动 API :3000 |
| Web       | `npm run dev`         | 公众站 :5173   |
| Web       | `npm run check`       | TypeScript 检查 |
| Admin     | `npm run dev`         | 后台 :5174     |
| Admin     | `npm run check`       | TypeScript 检查 |
| MobileApp | `flutter run`         | 运行到设备/模拟器 |

## API 一览

| 方法       | 路径                                | 说明             | 权限           |
| ---------- | ----------------------------------- | ---------------- | -------------- |
| POST       | `/api/auth/register`                | 注册（user 角色）| 公开           |
| POST       | `/api/auth/login`                   | 登录             | 公开           |
| GET        | `/api/auth/me`                      | 当前用户         | 登录           |
| GET        | `/api/traitors`                     | 档案列表（筛选） | 公开           |
| GET        | `/api/traitors/stats`               | 统计             | 公开           |
| GET        | `/api/traitors/timeline`            | 时间线           | 公开           |
| GET        | `/api/traitors/{id}`                | 档案详情         | 公开           |
| GET        | `/api/traitors/{id}/revisions`      | 修改历史         | 公开           |
| POST / PUT | `/api/traitors[/{id}]`              | 提交新建/修改    | user 及以上    |
| GET        | `/api/me/submissions`               | 我的提交         | 登录           |
| PUT        | `/api/me/profile`                   | 修改个人信息     | 登录           |
| PUT        | `/api/me/password`                  | 修改密码         | 登录           |
| POST       | `/api/uploads`                      | 上传附件         | 登录           |
| GET        | `/api/admin/menus`                  | 按角色返回菜单（三态过滤） | 登录           |
| GET / PUT  | `/api/admin/roles`                  | 角色列表 / 新增角色    | admin 及以上   |
| GET        | `/api/admin/roles/{role}/menus`     | 查某角色已授权菜单列表 | admin 及以上   |
| PUT        | `/api/admin/roles/{role}/menus`     | **配置角色菜单权限**（写入 RolePermissions） | admin 及以上 |
| GET / POST / PUT / DELETE | `/api/admin/menus[/{key}]` | 菜单 CRUD（含权限同步） | superadmin / admin |
| GET        | `/api/admin/revisions`              | 待审队列         | manager 及以上 |
| GET        | `/api/admin/revisions/{rid}`        | 审核详情         | manager 及以上 |
| POST       | `/api/admin/revisions/{rid}/review` | 审核             | manager 及以上 |
| GET        | `/api/admin/users`                  | 用户列表         | admin 及以上   |
| POST       | `/api/admin/users`                  | 新增用户         | admin 及以上   |
| PUT        | `/api/admin/users/{id}`             | 修改用户信息/重置密码 | admin 及以上 |
| PUT        | `/api/admin/users/{id}/role`        | 调整用户角色     | admin 及以上   |
| DELETE     | `/api/admin/users/{id}`             | 删除用户         | admin 及以上   |

<br />
