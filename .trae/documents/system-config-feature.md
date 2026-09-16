# 系统配置功能实现计划

## Context
当前 web 项目首页/名录/查询页的分页 pageSize 硬编码为 20，无法通过后台调整。需要新增一个系统配置功能，admin 后台可修改 web/webapi/mobileapp 的配置项，第一个用例是 web 项目的分页条数。

## 一、后端（webapi）

### 1. 新建实体 `webapi/src/Entities/SystemConfig.cs`
- 字段：`Id`(string, GUID "N")、`Key`(string, 唯一)、`Value`(string)、`Category`(string, 如 web/webapi/mobileapp)、`Description`(string?)、`CreatedAt`、`UpdatedAt?`

### 2. AppDbContext 注册
- `webapi/src/Data/AppDbContext.cs`：新增 `DbSet<SystemConfig>` + `modelBuilder.Entity<SystemConfig>` 建唯一索引(`Key`)和普通索引(`Category`)

### 3. Program.cs 增量建表
- `webapi/Program.cs` 的 `EnsureMissingTablesAsync` 中追加 `EnsureTableAsync(db, "SystemConfigs", ...)`
- 同时用 `EnsureColumnAsync` 补列（兼容旧库）

### 4. DTO `webapi/src/Dtos/SystemConfigDtos.cs`
- `SystemConfigDto { Id, Key, Value, Category, Description, CreatedAt, UpdatedAt }`
- `UpdateConfigRequest { Value, Description? }`（Key/Category 不可改）

### 5. Service `webapi/src/Services/SystemConfigService.cs`
- 注入 `AppDbContext db, CacheService cache`
- `ListAsync()` — admin 用，返回全部
- `GetPublicConfigAsync()` — web 用，走缓存，只返回 `category="web"` 的 Key→Value 字典
- `UpdateAsync(id, req)` — 更新 Value，`cache.InvalidateAsync`

### 6. 控制器
- `webapi/src/Controllers/SystemConfigsController.cs`：`[HttpGet("api/config")]` 公开接口，返回 `{ items: { key: value, ... } }`
- `webapi/src/Controllers/AdminSystemConfigsController.cs`：`[Route("api/admin/system-configs")][Authorize(Roles="admin,superadmin")]`，`GET` 列表 + `PUT /{id}` 更新

### 7. Program.cs 注册
- `builder.Services.AddScoped<SystemConfigService>();`

### 8. DbSeeder 种子
- `webapi/src/Data/DbSeeder.cs`：新增 `SeedSystemConfigsAsync`，幂等插入 3 条默认配置：
  - `web.home.pageSize = 20`（Web 首页每页条数）
  - `web.roster.pageSize = 20`（Web 名录每页条数）
  - `web.lookup.pageSize = 20`（Web 查询每页条数）
- 菜单 `SeedMenusAndPermissionsAsync` 的 `defaults` 数组追加 `("system-config", "/settings", "系统配置", 6, "system", ["admin","superadmin"])`

## 二、Admin 前端

### 1. 类型 `admin/src/types/index.ts`
```ts
export interface SystemConfig {
  id: string; key: string; value: string;
  category: string; description: string | null;
  createdAt: string; updatedAt: string | null;
}
```

### 2. API `admin/src/lib/api.ts`
- `listSystemConfigs()` → `GET /admin/system-configs`
- `updateSystemConfig(id, { value, description })` → `PUT /admin/system-configs/{id}`

### 3. 页面 `admin/src/pages/SystemConfig.tsx`
- 参照 WebMenus.tsx 风格：按 category 分组渲染表格，编辑 modal 只改 Value

### 4. 路由 `admin/src/App.tsx`
- AdminOnlyRoute 下新增 `<Route path="/settings" element={<SystemConfig />} />`

### 5. i18n
- 8 个 locale 文件补 `menu.system-config` + `systemConfig` 段

## 三、Web 前端

### 1. API `web/src/lib/api.ts`
- `getPublicConfig()` → `GET /config`

### 2. Store `web/src/stores/config.ts`（新建）
- zustand store，`load()` 拉取配置，`getPageSize(key, fallback)` 返回数字或降级 fallback

### 3. Layout 加载
- `web/src/components/Layout.tsx` 中 `useEffect` 调 `useConfig.getState().load()`

### 4. 替换三处硬编码 PAGE_SIZE
- `web/src/pages/Home.tsx`：`const PAGE_SIZE = 20` → `const pageSize = useConfig(s => s.getPageSize('web.home.pageSize', 20))`
- `web/src/pages/Roster.tsx`：同上用 `'web.roster.pageSize'`
- `web/src/pages/Lookup.tsx`：同上用 `'web.lookup.pageSize'`

## 四、验证
1. `dotnet build` 0w0e
2. admin `tsc --noEmit` 通过
3. web `tsc --noEmit` 通过
4. 端到端：admin 改 `web.home.pageSize=10` → web 首页刷新后每页 10 条
