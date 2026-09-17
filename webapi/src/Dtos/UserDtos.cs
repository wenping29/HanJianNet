namespace HanJianNet.WebApi.Dtos;

public class CreateUserRequest
{
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Role { get; set; } = "";
}

public class UpdateUserRequest
{
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = "";
}

public class UpdateProfileRequest
{
    /// <summary>用户名（可选，留空表示不修改；移动端个人资料页不允许修改）</summary>
    public string? Username { get; set; }
    /// <summary>邮箱（可选，留空表示不修改）</summary>
    public string? Email { get; set; }
    /// <summary>性别：male / female / secret；null 不修改，空串清除</summary>
    public string? Gender { get; set; }
    /// <summary>生日（yyyy-MM-dd）；null 不修改，空串清除</summary>
    public string? Birthday { get; set; }
    /// <summary>联系地址；null 不修改，空串清除</summary>
    public string? Address { get; set; }
    /// <summary>手机号；null 不修改，空串清除</summary>
    public string? Phone { get; set; }
    /// <summary>昵称（可修改的显示名）；null 不修改，空串清除</summary>
    public string? Nickname { get; set; }
    /// <summary>个性签名；null 不修改，空串清除</summary>
    public string? Signature { get; set; }
    /// <summary>所在地区；null 不修改，空串清除</summary>
    public string? Region { get; set; }
}

public class UpdateAvatarRequest
{
    public string AvatarUrl { get; set; } = "";
}

public class NotificationDto
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string ReferenceName { get; set; } = "";
    public string? Comment { get; set; }
    public string? RevisionId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}
