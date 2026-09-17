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
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
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
