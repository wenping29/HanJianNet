using System.Security.Claims;
using HanJianNet.WebApi.Common;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 从 ClaimsPrincipal 中提取当前用户信息。
/// JWT 中 sub 声明存用户 Id，role 声明存角色 Key。
/// </summary>
public static class CurrentUser
{
    public static string GetId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value
               ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? throw new UnauthorizedAccessException("无法识别当前用户");
    }

    public static string GetRole(ClaimsPrincipal user)
    {
        return user.FindFirst("role")?.Value ?? Roles.Guest;
    }
}
