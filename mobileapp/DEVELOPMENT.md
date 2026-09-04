# 汉奸档案 · 移动端开发文档（Flutter）

> 状态：**仅文档，暂不开发。** 本文档锁定本轮产品范围、页面、鉴权与接口约定，供后续实现对照。  
> 平台：iOS + Android。后端沿用现有 `webapi`（REST + JWT），不新增专用 App 接口。  
> 目录：`mobileapp/`。日期：2026-09-04。

---

## 1. 目标

做一个可上架双端的浏览 + 协作 App：

1. **未登录即可浏览**已发布汉奸档案（列表、数量、详情）。
2. **提交 / 修改档案必须登录**；未登录点「修改」时跳转登录，登录成功后回到编辑页。
3. 底部三个 Tab：**首页 / 查询 / 我的**。
4. 首页展示汉奸数量与汉奸列表；点击卡片进入浏览页。
5. 浏览页可查看完整档案，并支持发起修改（走待审修订，不直接覆盖已发布数据）。

本轮 **不做**：地图、历史事件独立模块、后台审核、角色管理、公众站动态菜单、时间线专题页。

---

## 2. 现状与差距

现有工程已能跑通部分浏览与登录，但信息架构与本轮需求不一致。

| 现有 | 本轮目标 |
| ---- | -------- |
| 底部两 Tab：史册 / 我的 | 三 Tab：首页 / 查询 / 我的 |
| 首页内嵌名称/年份检索 + 时期筛选 + 时间线 | 首页只做数量 + 列表；检索独立到「查询」 |
| 详情可看，无编辑入口 | 详情有「修改」；登录后提交 `PUT /api/traitors/{id}` |
| `ApiClient` 无创建/更新/上传 | 补齐投稿、修订、附件上传、分页 |
| 默认 API：`http://10.0.2.2:3000`（仅 Android 模拟器） | 按平台区分默认地址，真机可配置 |

实现时应在现有 `lib/` 上改造，而不是另起工程。

---

## 3. 产品规则

### 3.1 访客（未登录）

- 可看首页数量、档案列表、查询结果、档案详情、修改历史（只读）。
- 不可提交新档案、不可保存修改、不可上传附件。
- 点「修改此档案」或「提交新档案」→ 登录页；登录成功后继续原操作。

### 3.2 登录用户（`user` 及以上）

- 具备访客全部能力。
- 可提交新档案：`POST /api/traitors`，生成 `status=pending` 的修订。
- 可修改已发布档案：`PUT /api/traitors/{id}`，原发布版本保持可见，待审核通过后才更新。
- 可在「我的」查看本人提交记录（待审 / 通过 / 驳回）。

### 3.3 审核语义（必须在 UI 上写清楚）

- App **不审核**。提交后提示：「已提交，等待管理员审核；通过后才会更新公开档案。」
- 详情页始终展示 **已发布版本**，不要把待审 payload 当成当前正文。

### 3.4 角色

App 不按角色隐藏浏览。只要登录成功即可投稿/改档（与 Web 一致：`user` 及以上）。管理员账号也可以用 App 浏览和提交修订；**不要**在 App 里做后台直写（`/api/admin/traitors`）。

---

## 4. 信息架构

```
Root（IndexedStack + NavigationBar）
├── 首页 Home
│     └── 档案详情 TraitorDetail（栈内 push）
│           └── 编辑档案 TraitorForm(mode=edit)
├── 查询 Search
│     └── 档案详情（同上）
└── 我的 Mine
      ├── 未登录：登录 / 注册 / API 地址
      └── 已登录：资料、我的提交、提交新档案、退出
            └── 提交新档案 TraitorForm(mode=create)
```

登录、注册为独立全屏路由（不占底部 Tab），便于从详情「修改」跳转回来。

**登录页必须提供「没有账号？去注册」**，点击进入注册页（保留登录页在栈内）。注册成功（接口会直接发 Token）后关闭注册与登录，继续原 `redirect`（如编辑页）。注册页已有「已有账号？去登录」：若从登录 push 而来则 `pop` 回登录，不要再 `pushReplacement` 一层登录。

建议路由表（实现时可用 `go_router` 或 `Navigator 2.0`；本轮不强制，但页面名以下表为准）：

| 路由名 | 页面 | 鉴权 |
| ------ | ---- | ---- |
| `/` | 底部壳 | 否 |
| `/traitor/:id` | 浏览 | 否 |
| `/traitor/:id/edit` | 编辑 | 是 |
| `/submit` | 新建 | 是 |
| `/login` | 登录 | 否 |
| `/register` | 注册 | 否 |

---

## 5. 页面说明

### 5.1 首页

**目的：** 打开即看到规模与人物。

**展示：**

- 顶部标题「汉奸档案」。
- **数量条**：主数字用 `GET /api/traitors/stats` 的 `total`（档案总数）。副文案可用时期分布 `periods`（若接口有返回），没有则只显示总数。
- **列表**：`GET /api/traitors?page=1&pageSize=20`，卡片展示姓名、时期、派系、生卒、籍贯、头像（`photoUrl`）。
- 下拉刷新；滑到底加载下一页（`page++`，直到 `page >= totalPages`）。
- 空态：「暂无已发布档案」。
- 错误态：文案 + 重试。不要求登录。

**交互：** 点卡片 → 浏览页。首页 **不要** 放检索框（检索归「查询」Tab）。

### 5.2 查询

**目的：** 按条件找人。

**筛选（均可选，组合查询）：**

| 字段 | Query | 控件 |
| ---- | ----- | ---- |
| 姓名 | `name` | 输入框 |
| 时期 | `period` | 分段：全部 / 宋末 / 明末 / 清末 / 民国 / 其他 |
| 年份从 | `yearFrom` | 数字 |
| 年份到 | `yearTo` | 数字 |
| 事件关键词 | `event` | 输入框 |
| 籍贯 | `nativePlace` | 输入框 |

点「查询」调用 `GET /api/traitors`（带分页）。结果列表与首页卡片组件复用。点卡片进同一浏览页。

无结果：「没有符合条件的档案」。

### 5.3 浏览页（详情）

**数据：** `GET /api/traitors/{id}`；修改历史 `GET /api/traitors/{id}/revisions`（失败则隐藏该块，不挡正文）。

**区块顺序：**

1. 头部：照片、姓名、字/号、生卒、籍贯、时期、派系、身份标签、别名  
2. 简介 `summary`  
3. 生平 `lifeEvents`  
4. 犯罪记录 `crimeRecords`  
5. 配偶 / 子女 / 居住地  
6. 照片画廊、罪证（相对路径 `/uploads/...` 拼 API Origin）  
7. 史料来源  
8. 修改历史（修改人、时间、摘要、审核人、结果）  
9. 底部固定操作：**修改此档案**

**修改按钮：**

- 未登录 → `/login`，`redirect` 记为 `/traitor/:id/edit`。  
- 已登录 → 打开编辑页，表单预填当前已发布数据。

相关人物 `relatedIds`：有则列出并可跳转其它详情；本轮可不做图谱。

### 5.4 编辑 / 新建表单

共用 `TraitorForm`。

- **新建：** 空表；提交 `POST /api/traitors`。  
- **编辑：** 预填详情 DTO；提交 `PUT /api/traitors/{id}`。  
- 必填：`name`、`changeSummary`（修改说明，给审核员看）。  
- 选填：与 Web 对齐的字段（字号、生卒及精确度 `exact/circa/unknown`、籍贯、时期、派系、简介、标签、配偶/子女/居住地/生平/犯罪记录/史料）。  
- 附件：登录后 `POST /api/uploads`（`multipart`：`file` + `kind=photo|evidence`），把返回的 `{ id, url, kind, fileType }` 写入 `attachments`。  
- 成功：Toast + 回到上一页；编辑成功后详情仍显示旧发布版。  
- 401：清 Token，跳登录。  
- 校验失败：展示接口 `message`。

第一期允许「基础字段 + 修改说明」先做完，亲属/犯罪记录等用「添加一条」动态列表，不必一次做完所有高级控件。

### 5.5 登录页

- 字段：邮箱/用户名、密码；主按钮「登录」。
- **次入口：「没有账号？去注册」** → `/register`（或 `Navigator.push` 注册页）。
- 从详情/提交拦截进来时，登录或注册成功都要带着原 `redirect` 返回，不能把用户丢在「我的」。
- API 地址设置可放在 AppBar。

### 5.6 注册页

- 字段：用户名、邮箱、密码、确认密码。
- 次入口：「已有账号？去登录」→ 返回登录页（栈上已有登录则 pop）。
- 注册成功即视为已登录（`POST /api/auth/register` 返回 token）。

### 5.7 我的

**未登录：** 登录、注册、当前 API 地址（可编辑保存）。「我的」上的注册与登录页上的注册是同一页面。  
**已登录：** 用户名、角色、邮箱；「提交新档案」；「我的提交」列表（`GET /api/me/submissions`，状态色：待审金 / 通过绿 / 驳回红）；修改密码可选（二期）；退出登录。

登录：`account` 可为用户名或邮箱。注册：用户名 + 邮箱 + 密码。Token 与用户信息持久化（现有 `shared_preferences` 即可）。

---

## 6. 接口清单（本轮使用）

Base URL 示例：`http://localhost:3000`。鉴权头：`Authorization: Bearer <jwt>`。

| 方法 | 路径 | 登录 | 用途 |
| ---- | ---- | ---- | ---- |
| GET | `/api/traitors/stats` | 否 | 首页数量 |
| GET | `/api/traitors` | 否 | 列表/查询。query：`name, yearFrom, yearTo, event, period, nativePlace, page, pageSize` |
| GET | `/api/traitors/{id}` | 否 | 详情 `{ traitor }` |
| GET | `/api/traitors/{id}/revisions` | 否 | 修改历史 `{ items }` |
| POST | `/api/auth/login` | 否 | `{ account, password }` → `{ token, user }` |
| POST | `/api/auth/register` | 否 | `{ username, email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | 是 | 启动时校验 Token |
| POST | `/api/traitors` | 是 | 新建修订，body 为档案字段 + `changeSummary` |
| PUT | `/api/traitors/{id}` | 是 | 修改修订 |
| POST | `/api/uploads` | 是 | 附件 |
| GET | `/api/me/submissions` | 是 | 我的提交 |
| PUT | `/api/me/password` | 是 | 改密（二期） |

列表响应：`{ items, total, page, pageSize, totalPages }`。列表项是摘要（含 `photoUrl`），详情才有完整嵌套数组。

**不要调用** `/api/admin/*`。

### 6.1 提交 Body 要点

与 `TraitorInputDto` + `changeSummary` 对齐，JSON camelCase。嵌套数组缺省传 `[]`。`birthYearType` / `deathYearType`：`exact` | `circa` | `unknown`。

成功响应：`{ revisionId }`，不是更新后的档案对象。

### 6.2 统计字段注意

当前 WebApi `GET /api/traitors/stats` 返回 `total`、`periods`、`earliestYear`、`latestYear`。现有 Flutter `TraitorStats` 仍按旧字段 `sentenced/childrenInfo/descendantsStatus` 解析，**实现时必须改模型**，否则首页数量可能一直为 0。

---

## 7. 客户端架构（实现时）

建议目录：

```
lib/
  main.dart                 # 启动、Session.load、MaterialApp
  config.dart               # 默认 API
  app.dart                  # 底部三 Tab 壳
  models/models.dart        # DTO，与 API 对齐
  services/api_client.dart  # HTTP
  services/session.dart     # token / user / apiBaseUrl
  screens/
    home_screen.dart
    search_screen.dart
    mine_screen.dart
    traitor_detail_screen.dart
    traitor_form_screen.dart
    login_screen.dart
    register_screen.dart
  widgets/
    theme.dart              # 沿用墨色/宣纸/朱砂
    traitor_card.dart
    common.dart
```

约束：

- 一个 `ApiClient` 单例；所有请求走它。  
- 相对资源 URL 解析：`origin + path`。  
- iOS 模拟器默认 `http://127.0.0.1:3000`；Android 模拟器默认 `http://10.0.2.2:3000`；真机默认填可配置的局域网或线上 Origin。  
- Android 明文 HTTP：`android:usesCleartextTraffic="true"`（开发）。iOS：`NSAppTransportSecurity` 对开发环境允许本地 HTTP。生产应走 HTTPS。  
- 主题继续用 `AppTheme`（`#0E0B08` 墨底、`#F2EAD8` 纸色、`#9B2B2B` 朱砂），与 Web 一致。

依赖（现有 + 实现编辑时再加）：

- 已有：`http`、`shared_preferences`  
- 编辑上传可能需要：`image_picker`（相册/拍照）、`file_picker`（罪证 PDF，可选）

---

## 8. 双端与工程

- SDK：`pubspec.yaml` 已要求 Dart `^3.11.1`，Flutter 3.x stable。  
- Android：`mobileapp/android`；最低建议 API 21+。  
- iOS：`mobileapp/ios`；最低建议 iOS 13+。  
- 图标与启动图沿用现有 Runner 资源，本轮可不换品牌图。  
- 运行：先起 `webapi`（:3000），再 `cd mobileapp && flutter run`。

---

## 9. 分期（开发时按此切，本文档阶段不写代码）

| 期 | 内容 | 完成标准 |
| -- | ---- | -------- |
| P0 | 三 Tab 壳；首页数量+分页列表；详情只读；查询页；API 分页与 stats 模型修正 | 未登录可浏览、可搜索 |
| P1 | 登录/注册/会话；详情「修改」拦截；编辑/新建表单基础字段；PUT/POST 修订 | 登录后能提交待审 |
| P2 | 动态列表（亲属/犯罪/生平）；附件上传；我的提交 | 与 Web 投稿能力接近 |
| P3 | 改密、附件预览、无障碍与真机 HTTPS、应用商店资源 | 可发布 |

---

## 10. 验收清单

- [ ] iOS 模拟器与 Android 模拟器均可浏览列表与详情，无需登录。  
- [ ] 首页数字与列表 `total` 一致（或列表为分页子集，数字仍用 stats.total）。  
- [ ] 查询条件能缩小结果；清空后可再查。  
- [ ] 未登录点修改 → 登录 → 回到编辑页。  
- [ ] 登录页可进入注册；注册成功后等同已登录并回到原目标页；注册页可返回登录。  
- [ ] 登录后提交修改，公开详情仍是旧版，我的提交出现 pending。  
- [ ] 后台审核通过后，刷新详情看到新内容。  
- [ ] Token 过期时操作返回 401，清会话并提示重新登录。  
- [ ] 相对路径照片能显示。  
- [ ] 断网有错误提示，不白屏。

---

## 11. 非目标（避免范围膨胀）

- 不做管理员审核 UI。  
- 不做地图 / 省份统计 / 历史事件站点。  
- 不在 App 内管理用户、角色、菜单。  
- 不把 Web 全部页面 1:1 搬过来。  
- 本轮不改 WebApi 契约；若发现 stats 等字段与客户端不一致，以 **WebApi 实际 JSON** 为准改 Flutter 模型。

---

## 12. 确认后即可开工

文档确认后，按第 9 节 P0 → P1 实现即可。开工前只需再确认两点（有默认可直接开工）：

1. 首页列表默认 `pageSize`：建议 **20**。  
2. 第一期编辑表单：建议 **P1 只做基础字段 + 修改说明**，复杂子表放 P2。
