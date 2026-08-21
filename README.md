# 汉奸档案 · HanJianNet

近代汉奸档案史册平台（Web 公众站 + 后台管理 + Flutter 移动端 App）。公众可检索浏览，注册用户可提交档案（生卒、籍贯、配偶、子女、居住地、犯罪记录、照片、罪证），提交经后台审核后发布，档案支持完整修改历史溯源（修改人 / 修改时间 / 修改内容 / 审核人 / 审核日期 / 审核结果）。

## 技术栈

- 公众站 `Web`：React 18 + Vite + Tailwind CSS + React Router + Zustand + TypeScript
- 后台 `Admin`：React 18 + Vite + Tailwind CSS + TypeScript（独立应用）
- 移动端 `MobileApp`：Flutter（Android / iOS）
- 后端 `WebApi`：ASP.NET Core（.NET 10）+ Entity Framework Core + SQLite
- 鉴权：JWT Bearer + BCrypt，五级角色 RBAC（超级管理员 / 管理员 / 管理 / 普通用户 / 游客）
- 文件上传：API 内置静态文件服务（`/uploads`，照片 / 罪证）
- 跨域：API 端 CORS 白名单（默认放行 5173 / 5174 开发端口）

## 仓库结构（四个完全独立的子项目）

```
Admin/      后台管理系统（登录/动态菜单/待审队列/审核详情/用户管理/个人信息）
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

## 后台菜单配置

菜单在 `WebApi/src/Services/MenuService.cs` 中集中配置，每个菜单项声明可见角色，接口按当前登录用户角色过滤返回：

| 菜单 | 路径 | 可见角色 |
| ---- | ---- | -------- |
| 待审队列 | `/reviews` | manager / admin / superadmin |
| 用户管理 | `/users` | admin / superadmin |
| 个人信息 | `/profile` | manager / admin / superadmin |

Admin 前端启动后从 `GET /api/admin/menus` 动态拉取并渲染导航，新增菜单只需在后端配置表中添加一项。

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
| GET        | `/api/admin/menus`                  | 按角色返回菜单   | 登录           |
| GET        | `/api/admin/revisions`              | 待审队列         | manager 及以上 |
| GET        | `/api/admin/revisions/{rid}`        | 审核详情         | manager 及以上 |
| POST       | `/api/admin/revisions/{rid}/review` | 审核             | manager 及以上 |
| GET        | `/api/admin/users`                  | 用户列表         | admin 及以上   |
| POST       | `/api/admin/users`                  | 新增用户         | admin 及以上   |
| PUT        | `/api/admin/users/{id}`             | 修改用户信息/重置密码 | admin 及以上 |
| PUT        | `/api/admin/users/{id}/role`        | 调整用户角色     | admin 及以上   |
| DELETE     | `/api/admin/users/{id}`             | 删除用户         | admin 及以上   |

<br />
