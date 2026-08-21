# 汉奸档案 · HanJianNet

近代汉奸档案史册平台（Web 公众站 + 后台管理 + Flutter 移动端 App）。公众可检索浏览，注册用户可提交档案（生卒、籍贯、配偶、子女、居住地、犯罪记录、照片、罪证），提交经后台审核后发布，档案支持完整修改历史溯源（修改人 / 修改时间 / 修改内容 / 审核人 / 审核日期 / 审核结果）。

## 技术栈

- 公众站 `web`：React 18 + Vite + Tailwind CSS + React Router + Zustand + TypeScript
- 后台 `admin`：React 18 + Vite + Tailwind CSS + TypeScript（独立应用）
- 移动端 `mobileapp`：Flutter（Android / iOS）
- 后端 `webapi`：Express + TypeScript + Prisma + SQLite
- 鉴权：JWT + bcrypt，RBAC（visitor / user / admin）
- 文件上传：Multer（照片 / 罪证）
- 校验：Zod（webapi 请求体校验；各前端表单校验各自实现）

## 仓库结构（四个完全独立的子项目）

```
admin/      后台管理系统（管理员登录/待审队列/审核详情）
web/        公众网站（首页/详情/关于/登录注册/提交/编辑/个人中心）
mobileapp/  移动端 App（Flutter：浏览/检索/详情/登录）
webapi/     Express Web API（唯一后端，含 Prisma 与 uploads/）
```

四个子项目完全独立：各自维护依赖、脚本与类型定义，无共享包，仅通过 REST API（JWT）通信。

## 快速开始

```bash
# 1. 启动后端 API（先跑，三个客户端都要请求它）
cd webapi
npm install
npm run db:generate   # 生成 Prisma client
npm run db:push       # 同步 schema 到 SQLite
npm run db:seed       # 初始化管理员（admin / admin123456）
npm run dev           # http://localhost:3000

# 2. 公众网站
cd web && npm install && npm run dev      # http://localhost:5173

# 3. 后台管理
cd admin && npm install && npm run dev    # http://localhost:5174

# 4. 移动端 App（需 Flutter SDK）
cd mobileapp && flutter run
```

访问入口：公众站 <http://localhost:5173/> ，后台 <http://localhost:5174/> ，API <http://localhost:3000/> 。

## 常用命令

| 子项目       | 命令                                     | 说明          |
| --------- | -------------------------------------- | ----------- |
| webapi    | `npm run dev`                          | 启动 API      |
| webapi    | `npm run db:push` / `db:seed` / `db:studio` | 数据库操作   |
| web       | `npm run dev`                          | 公众站 :5173   |
| admin     | `npm run dev`                          | 后台 :5174    |
| mobileapp | `flutter run`                          | 运行到设备/模拟器 |

<br />
