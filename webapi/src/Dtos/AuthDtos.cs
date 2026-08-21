namespace HanJianNet.WebApi.Dtos;

public class UserDto
{
    public string Id { get; set; } = "";
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class UserBriefDto
{
    public string Id { get; set; } = "";
    public string Username { get; set; } = "";
}

public class AuthResponse
{
    public string Token { get; set; } = "";
    public UserDto User { get; set; } = new();
}

public class RegisterRequest
{
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    public string Account { get; set; } = "";
    public string Password { get; set; } = "";
}
