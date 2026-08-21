using System.Security.Claims;

namespace HanJianNet.WebApi.Controllers;

public static class CurrentUser
{
    public static string GetId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value
               ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? throw new UnauthorizedAccessException("无法识别当前用户");
    }
}
