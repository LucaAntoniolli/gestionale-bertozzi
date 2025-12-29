namespace NemesiAPI.Model
{
    public class RegisterModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Nominativo { get; set; }
        public string Ruolo { get; set; }
        public bool IsEsterno { get; set; }
        public string? Societa { get; set; }
        public decimal CostoOrario { get; set; }
    }

    public class LoginModel
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string? Ruolo { get; set; }
    }

    public class GenerateResetPasswordModel
    {
        public string Email { get; set; }
    }

    public class ResetPasswordModel
    {
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }

    public class ChangePasswordModel
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class UserWithRolesModel
    {
        public string Id { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Nominativo { get; set; }
        public bool IsEsterno { get; set; } 
        public string? Societa { get; set; }
        public decimal CostoOrario { get; set; }
        public List<string> Ruoli { get; set; } = new();
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
