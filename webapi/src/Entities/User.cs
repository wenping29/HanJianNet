namespace HanJianNet.WebApi.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "user";
    /// <summary>头像地址（/uploads/ 下的相对路径），null 表示未设置。</summary>
    public string? AvatarUrl { get; set; }
    /// <summary>性别：male / female / secret，null 表示未设置。</summary>
    public string? Gender { get; set; }
    /// <summary>生日（yyyy-MM-dd），null 表示未设置。用字符串存储避免时区问题。</summary>
    public string? Birthday { get; set; }
    /// <summary>联系地址，null 表示未设置。</summary>
    public string? Address { get; set; }
    /// <summary>手机号，null 表示未设置。</summary>
    public string? Phone { get; set; }
    /// <summary>昵称（可修改的显示名，用户名不可修改），null 表示未设置。</summary>
    public string? Nickname { get; set; }
    /// <summary>个性签名，null 表示未设置。</summary>
    public string? Signature { get; set; }
    /// <summary>所在地区（如“江苏省”），null 表示未设置。</summary>
    public string? Region { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
