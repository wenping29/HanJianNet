# 合并同名汉奸记录 — 实现计划

## Context

汉奸档案数据库中存在同名同籍贯的重复记录（多人录入、历史导入等原因）。需要新增一个 admin 后台页面，按"姓名 + 籍贯"识别重复组，让管理员选择一条主记录，将其余记录的所有子数据（配偶/子女/住所/罪行/生平/附件/来源/别名标签）全部迁移到主记录，然后将重复记录**标记为已合并**（不物理删除，可回溯）。

## 用户选择

- 子记录合并：**全部合并不去重**（直接迁移所有子记录到主记录）
- 重复记录处理：**标记为已合并**（加 `MergedIntoId` 字段，不删除）
- 重复识别：**姓名 + 籍贯**（Name + NativePlace 完全一致）
- 页面入口：**名录管理下的子页面**（路由 `/traitors/merge`，菜单 parent=`traitors`）

## 后端改动

### 1. Traitor 实体新增合并标记字段
文件：`webapi/src/Entities/Traitor.cs`

在 `UpdatedAt` 后新增：
```csharp
public string? MergedIntoId { get; set; }
public DateTime? MergedAt { get; set; }
```

> 注意：项目用 `EnsureCreated()`（无 Migration）。新增可空列在全新数据库时会自动创建；**已有数据库需手动 ALTER TABLE** 或重建。SQLite 语句：`ALTER TABLE Traitors ADD COLUMN MergedIntoId TEXT; ALTER TABLE Traitors ADD COLUMN MergedAt TEXT;`

### 2. TraitorService 新增两个方法
文件：`webapi/src/Services/TraitorService.cs`

**`FindDuplicatesAsync(string? name, string? nativePlace)`**：
- 查询 `MergedIntoId == null` 的记录
- 按 `Name + NativePlace` 分组，仅返回 `Count > 1` 的组
- 可选 name/nativePlace 过滤（Contains）
- 返回 `List<DuplicateGroupDto>`，每组含 `{ name, nativePlace, items: List<TraitorSummaryDto> }`
- items 按创建时间升序（最早的可能是原始记录）

**`MergeAsync(string primaryId, List<string> sourceIds)`**：
- 验证 primaryId 和所有 sourceIds 存在且 `MergedIntoId == null`
- primaryId 不能在 sourceIds 中
- 对每个 source 记录：
  - 将所有子集合（Spouses/Children/Residences/CrimeRecords/LifeEvents/Attachments/Sources）的 `TraitorId` 更新为 `primaryId`（EF Core 直接批量 UPDATE，不需要逐条加载）
  - 将 source 的 `AliasesJson` / `IdentityTagsJson` / `RelatedIdsJson` 合并到主记录（JSON 数组 union，不去重）
  - 设置 `source.MergedIntoId = primaryId`、`source.MergedAt = DateTime.UtcNow`
- 保存后失效缓存（`cache.InvalidateAsync(CacheGroup)`）
- 返回合并后的主记录 `TraitorDto`

### 3. DTO 新增
文件：`webapi/src/Dtos/TraitorDtos.cs`（或同目录下合适文件）

```csharp
public class DuplicateGroupDto
{
    public string Name { get; set; } = "";
    public string NativePlace { get; set; } = "";
    public List<TraitorSummaryDto> Items { get; set; } = [];
}

public class MergeRequestDto
{
    public string PrimaryId { get; set; } = "";
    public List<string> SourceIds { get; set; } = [];
}
```

### 4. TraitorsController 新增两个 admin 接口
文件：`webapi/src/Controllers/TraitorsController.cs`

```csharp
[Authorize(Roles = "admin,superadmin")]
[HttpGet("api/admin/traitors/duplicates")]
public async Task<IActionResult> AdminDuplicates([FromQuery] string? name, [FromQuery] string? nativePlace)
    => Ok(new { items = await traitors.FindDuplicatesAsync(name, nativePlace) });

[Authorize(Roles = "admin,superadmin")]
[HttpPost("api/admin/traitors/merge")]
public async Task<IActionResult> AdminMerge([FromBody] MergeRequestDto req)
    => Ok(new { traitor = await traitors.MergeAsync(req.PrimaryId, req.SourceIds) });
```

### 5. DbSeeder 新增菜单
文件：`webapi/src/Data/DbSeeder.cs` 的 `defaults` 数组中，在 `("traitors", ...)` 行后新增：
```csharp
("merge-traitors", "/traitors/merge", "数据合并", 2, "traitors", ["admin", "superadmin"]),
```

### 6. 验证
- `dotnet build` 0w0e

## 前端 admin 改动

### 1. types/index.ts 新增类型
文件：`admin/src/types/index.ts`

```typescript
export interface DuplicateGroup {
  name: string
  nativePlace: string
  items: TraitorSummary[]
}
```

### 2. lib/api.ts 新增两个方法
文件：`admin/src/lib/api.ts`

```typescript
findDuplicates: (name?: string, nativePlace?: string) => {
  const params = new URLSearchParams()
  if (name) params.set('name', name)
  if (nativePlace) params.set('nativePlace', nativePlace)
  return request<{ items: DuplicateGroup[] }>(`/admin/traitors/duplicates?${params.toString()}`)
},

mergeTraitors: (primaryId: string, sourceIds: string[]) =>
  request<{ traitor: TraitorDetail }>('/admin/traitors/merge', {
    method: 'POST',
    body: JSON.stringify({ primaryId, sourceIds }),
  }),
```

### 3. 新建页面 MergeTraitors.tsx
文件：`admin/src/pages/MergeTraitors.tsx`

页面结构（参考 Traitors.tsx 的搜索 + Reviews.tsx 的卡片列表风格）：
- 顶部：标题"数据合并" + 副标题 "Merge Duplicates"
- 搜索表单：姓名（可选）+ 籍贯（可选）+ 搜索/重置按钮
- 结果区：每个重复组渲染为一个卡片
  - 卡片标题：姓名 + 籍贯 + 共 N 条
  - 表格列出该组所有记录：姓名 / 时期 / 派系 / 生卒 / 身份标签 / 创建时间 / 单选（选为主记录）
  - 默认选第一条（最早创建的）为主记录
  - "合并"按钮：将除主记录外的所有记录合并到主记录
  - 合并前 `window.confirm` 二次确认
  - 合并成功后 toast 提示 + 自动刷新列表
- 空结果：显示"暂无重复记录"

### 4. App.tsx 新增路由
文件：`admin/src/App.tsx`

在 `AdminOnlyRoute` 内新增：
```tsx
<Route path="/traitors/merge" element={<MergeTraitors />} />
```
注册在 `/traitors/:id/edit` 之前（React Router v6 静态路由优先匹配，但保持顺序清晰）。

### 5. 验证
- `npm run check`（tsc --noEmit）0 错误

## 端到端验证

1. 后端 `dotnet build` → 0w0e
2. 前端 admin `npm run check` → 0 错误
3. 启动后端 + admin 前端，用 admin 账号登录
4. 侧边栏"名录管理"下应出现"数据合并"子菜单
5. 手动创建 2-3 条同名同籍贯的记录 → 进入数据合并页 → 搜索 → 选中主记录 → 合并 → 验证主记录含全部子记录、重复记录被标记
