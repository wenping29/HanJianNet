namespace HanJianNet.WebApi.Common;

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => Total <= 0 ? 0 : (int)Math.Ceiling((double)Total / Math.Max(1, PageSize));
}
