namespace HanJianNet.WebApi.Common;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => Total <= 0 ? 0 : (int)Math.Ceiling((double)Total / Math.Max(1, PageSize));

    /// <summary>
    /// Keyset 游标：指向本页最后一行，传给下一次请求翻页；null 表示没有下一页。
    /// 仅游标分页模式（/api/traitors?cursor=...）有值；Offset 页码模式也会附带，便于"跳转后转游标续翻"。
    /// </summary>
    public string? NextCursor { get; init; }
}
