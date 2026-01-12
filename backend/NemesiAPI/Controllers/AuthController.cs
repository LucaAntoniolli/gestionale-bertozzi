using log4net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NemesiAPI.Model;
using NemesiCommons.Models;
using NemesiCOMMONS.Models;
using NemesiCOMMONS.Services;
using NemesiLIB.Context;
using NemesiLIB.Model;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;

namespace NemesiAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private const string AuthenticatorUriFormat = "otpauth://totp/{0}:{1}?secret={2}&issuer={0}&algorithm=SHA1&digits=6&period=30";

        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);
        private readonly IConfiguration configuration;
        private readonly UserManager<Utente> userManager;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly SignInManager<Utente> signInManager;
        private readonly IDataProtector dataProtector;
        private readonly IMailService mailService;
        private readonly UrlEncoder urlEncoder;

        private readonly GestionaleBertozziContext db;

        public AuthController(
        IConfiguration configuration,
        UserManager<Utente> userManager,
        RoleManager<IdentityRole> roleManager,
        SignInManager<Utente> signInManager,
        IMailService mailService,
        IDataProtectionProvider dataProtectionProvider,
        UrlEncoder urlEncoder,
        GestionaleBertozziContext db
    )
        {
            this.configuration = configuration;
            this.userManager = userManager;
            this.roleManager = roleManager;
            this.signInManager = signInManager;
            this.mailService = mailService;
            dataProtector = dataProtectionProvider.CreateProtector("DataProtectorTokenProvider");
            this.urlEncoder = urlEncoder;
            this.db = db;
        }

        [HttpGet("get-users")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUsers()
        {
            var users = await db.Users
                .AsNoTracking()
                .Select(u => new { u.Id, u.UserName, u.Email, u.Nominativo, u.IsEsterno, u.Societa, u.CostoOrario })
                .ToListAsync();

            var userRolePairs = await (from ur in db.UserRoles
                                       join r in db.Roles on ur.RoleId equals r.Id
                                       select new { ur.UserId, RoleName = r.Name })
                                      .ToListAsync();

            var result = users.Select(u => new UserWithRolesModel
            {
                Id = u.Id,
                UserName = u.UserName,
                Email = u.Email,
                Nominativo = u.Nominativo,
                IsEsterno = u.IsEsterno,
                Societa = u.Societa,
                CostoOrario = u.CostoOrario,
                Ruoli = userRolePairs.Where(ur => ur.UserId == u.Id).Select(ur => ur.RoleName ?? string.Empty).ToList()
            });

            return Ok(result);
        }

        [HttpGet("get-user")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUser()
        {
            var currentUser = User;
            log.Info($"lettura utente {currentUser.Identity?.Name}");

            var user = await userManager.FindByEmailAsync(currentUser?.Identity?.Name);
            if (user == null)
            {
                return NotFound();
            }

            var roles = await userManager.GetRolesAsync(user);

            var result = new UserWithRolesModel
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Nominativo = user.Nominativo,
                IsEsterno = user.IsEsterno,
                Societa = user.Societa,
                CostoOrario = user.CostoOrario,
                Ruoli = roles.ToList()
            };

            return Ok(result);
        }

        [HttpGet("get-roles")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetRoles()
        {
            var user = User;
            log.Info($"lettura ruoli utente {user.Identity.Name}");
            var result = await userManager.FindByEmailAsync(user?.Identity?.Name);
            var userRoles = await userManager.GetRolesAsync(result);
            return Ok(userRoles);
        }

        [HttpGet("get-roles/{email}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetUserRoles(string email)
        {
            var user = await userManager.FindByEmailAsync(email);
            if(user == null)
            {
                return NotFound();
            }
            var userRoles = await userManager.GetRolesAsync(user);
            return Ok(userRoles);
        }

        [HttpGet("get-all-roles")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> GetAllRoles()
        {
            var roles = await roleManager.Roles.ToListAsync();
            return Ok(roles);
        }

        [HttpPost("register")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            var utente = await userManager.FindByEmailAsync(model.Email);
            if (utente != null)
            {
                return BadRequest("L'email è già stata utilizzata");
            }

            var user = new Utente(model.Email, model.Nominativo, model.IsEsterno, model.Societa, model.CostoOrario);
            var result = await userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                var errori = "";
                foreach(var error in result.Errors.Select(e => e.Description))
                {
                    log.Error("Errore creazione utente: " + error);
                    errori += error + " ";
                }
                return BadRequest(errori);
            }


            await userManager.AddToRoleAsync(user, model.Ruolo);

            return Created();
        }

        [HttpPatch("update-user")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Update([FromBody] RegisterModel model)
        {
            var utente = await userManager.FindByEmailAsync(model.Email);

            if (utente == null)
            {
                return NotFound("Utente non trovato");
            }

            utente.Nominativo = model.Nominativo;
            utente.IsEsterno = model.IsEsterno;
            utente.Societa = model.Societa;
            utente.CostoOrario = model.CostoOrario;

            var result = await userManager.UpdateAsync(utente);

            if (!result.Succeeded)
            {
                var errori = "";
                foreach (var error in result.Errors.Select(e => e.Description))
                {
                    log.Error("Errore aggiornamento utente: " + error);
                    errori += error + " ";
                }
                return BadRequest(errori);
            }

            await userManager.RemoveFromRolesAsync(utente, await userManager.GetRolesAsync(utente));
            await userManager.AddToRoleAsync(utente, model.Ruolo);

            return NoContent();
        }

        [HttpDelete("unregister/{email}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [Authorize(Roles = "Amministratore")]
        public async Task<IActionResult> Unregister(string email)
        {
            var utente = await userManager.FindByEmailAsync(email);
            if (utente == null)
            {
                return NotFound("Utente non trovato");
            }

            return Ok(await userManager.DeleteAsync(utente));
        }

        [HttpPost("generate-reset-password-token")]
        [AllowAnonymous]
        public async Task<IActionResult> GenerateResetPasswordToken([FromBody] GenerateResetPasswordModel generateResetPassword)
        {
            var user = await userManager.FindByEmailAsync(generateResetPassword.Email);
            if (user == null)
            {
                return NotFound();
            }
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);

            var mailData = new MailData
            {
                EmailSubject = "Ripristino della password",
                EmailToId = user.Email,
                EmailTypeName = "reset-password",
                TemplateValues = new Dictionary<string, string>
                {
                    ["Link"] = $"{configuration.GetValue<string>("ApplicationUrls:ApplicationFrontend")}/auth/reset-password/{UrlEncoder.Default.Encode(resetToken)}",
                    ["ToName"] = user.Nominativo,
                    ["AppUrl"] = configuration.GetValue<string>("ApplicationUrls:ApplicationAPI")
                }
            };

            MailSendResult risultatoInvio = await mailService.SendHTMLMailAsync(mailData);

            if (!risultatoInvio.Esito)
            {
                log.Error(risultatoInvio.Errore);
                return BadRequest();
            }

            return Ok();
        }

        [HttpPost("admin-reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> AdminResetPassword(string email, string newPassword)
        {
            var user = await userManager.FindByEmailAsync(email);
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var result = await userManager.ResetPasswordAsync(user, token, newPassword);
            if (result.Succeeded)
            {
                return Ok();
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel resetPassword)
        {
            try
            {
                var resetTokenArray = Convert.FromBase64String(resetPassword.Token);
                var unprotectedResetTokenArray = dataProtector.Unprotect(resetTokenArray);
                using (var ms = new MemoryStream(unprotectedResetTokenArray))
                {
                    using (var reader = new BinaryReader(ms))
                    {
                        // Read off the creation UTC timestamp
                        reader.ReadInt64();

                        // Then you can read the userId!
                        var userId = reader.ReadString();
                        var user = await userManager.FindByIdAsync(userId);
                        var result = await userManager.ResetPasswordAsync(user, resetPassword.Token, resetPassword.NewPassword);
                        if (result.Succeeded)
                        {
                            var authToken = await GeneraToken(user.Email);
                            return Ok(new { Token = authToken, IsAuthSuccessful = true });
                        }
                        return BadRequest(result.Errors);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex);
            }
        }

        [HttpPost("change-password")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel changePasswordData)
        {
            var user = await userManager.FindByEmailAsync(User.Identity.Name);

            if (user == null)
            {
                return NotFound("Utente non trovato");
            }
            var result = await userManager.ChangePasswordAsync(user, changePasswordData.OldPassword, changePasswordData.NewPassword);
            if (!result.Succeeded)
            {
                var errori = "";
                foreach (var error in result.Errors.Select(e => e.Description))
                {
                    log.Error("Errore cambio password: " + error);
                    errori += error + " ";
                }
                return BadRequest(errori);
            }
            return Ok();
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                var user = await userManager.FindByEmailAsync(model.Email);

                if(user == null || !await userManager.CheckPasswordAsync(user, model.Password))
                {
                    return Unauthorized("Invalid email or password");
                }

                var isTfaEnabled = await userManager.GetTwoFactorEnabledAsync(user);

                //var result = await signInManager.PasswordSignInAsync(model.Email, model.Password, isPersistent: false, lockoutOnFailure: false);

                if (!isTfaEnabled)
                {
                    var token = await GeneraToken(model.Email);
                    var refreshToken = await GeneraRefreshToken(user.Id);
                    var userRoles = await userManager.GetRolesAsync(user);

                    return Ok(new { Token = token, RefreshToken = refreshToken, IsAuthSuccessful = true, IsTfaEnabled = false, User = user, Roles = userRoles });
                }

                return Ok(new { IsAuthSuccessful = true, IsTfaEnabled = true });

            }
            catch (Exception ex)
            {
                log.Error("Eccezione al login", ex);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("login-tfa")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginTfa([FromBody] TfaDto model)
        {
            var user = await userManager.FindByNameAsync(model.Email);
            if (user == null)
                return Unauthorized("Invalid Authentication");

            var validVerification =
              await userManager.VerifyTwoFactorTokenAsync(
                 user, userManager.Options.Tokens.AuthenticatorTokenProvider, model.Code);
            if (!validVerification)
                return BadRequest("Invalid Token Verification");

            var token = await GeneraToken(model.Email);
            var refreshToken = await GeneraRefreshToken(user.Id);
            var userRoles = await userManager.GetRolesAsync(user);

            return Ok(new { Token = token, RefreshToken = refreshToken, IsAuthSuccessful = true, IsTfaEnabled = false, User = user, Roles = userRoles });
        }

        [HttpPost("logout")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Logout()
        {
            try
            {
                await signInManager.SignOutAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            try
            {
                // Recupero il refresh token dal database
                var refreshToken = await db.RefreshTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

                if (refreshToken == null || !refreshToken.IsActive)
                {
                    return Unauthorized("Invalid or expired refresh token");
                }

                // Genero nuovi token
                var newAccessToken = await GeneraToken(refreshToken.User.Email);
                var newRefreshToken = await GeneraRefreshToken(refreshToken.UserId);

                // Revoco il vecchio refresh token
                refreshToken.IsRevoked = true;
                await db.SaveChangesAsync();

                var userRoles = await userManager.GetRolesAsync(refreshToken.User);

                return Ok(new 
                { 
                    Token = newAccessToken, 
                    RefreshToken = newRefreshToken, 
                    IsAuthSuccessful = true,
                    refreshToken.User,
                    Roles = userRoles
                });
            }
            catch (Exception ex)
            {
                log.Error("Errore durante il refresh del token", ex);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("tfa-setup")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTfaSetup(string email)
        {
            var user = await userManager.FindByNameAsync(email);

            if (user == null)
                return BadRequest("User does not exist");

            var isTfaEnabled = await userManager.GetTwoFactorEnabledAsync(user);

            var authenticatorKey = await userManager.GetAuthenticatorKeyAsync(user);
            if (authenticatorKey == null)
            {
                await userManager.ResetAuthenticatorKeyAsync(user);
                authenticatorKey = await userManager.GetAuthenticatorKeyAsync(user);
            }
            var formattedKey = GenerateQRCode(email, authenticatorKey);

            return Ok(new TfaSetupDto
            { IsTfaEnabled = isTfaEnabled, AuthenticatorKey = authenticatorKey, FormattedKey = formattedKey });
        }

        [HttpPost("tfa-setup")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> PostTfaSetup([FromBody] TfaSetupDto tfaModel)
        {
            var user = await userManager.FindByNameAsync(tfaModel.Email);
            var isValidCode = await userManager
                .VerifyTwoFactorTokenAsync(user,
                  userManager.Options.Tokens.AuthenticatorTokenProvider,
                  tfaModel.Code);

            if (isValidCode)
            {
                await userManager.SetTwoFactorEnabledAsync(user, true);
                return Ok(new TfaSetupDto { IsTfaEnabled = true });
            }
            else
            {
                return BadRequest("Invalid code");
            }
        }

        [HttpDelete("tfa-setup")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteTfaSetup(string email)
        {
            var user = await userManager.FindByNameAsync(email);
            if (user == null)
            {
                return BadRequest("User does not exist");
            }
            else
            {
                await userManager.SetTwoFactorEnabledAsync(user, false);
                return Ok(new TfaSetupDto { IsTfaEnabled = false });
            }
        }

        private async Task<string> GeneraToken(string userId)
        {
            var user = await userManager.FindByEmailAsync(userId);
            if (user == null)
                throw new InvalidOperationException("Utente non trovato durante la generazione del token.");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JwtSettings:Key"]));

            // Base claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email ?? string.Empty)
            };

            // Aggiungo eventuali claim a livello di utente
            var userClaims = await userManager.GetClaimsAsync(user);
            foreach (var uc in userClaims)
            {
                claims.Add(uc);
            }

            // Aggiungo i ruoli e i claim legati ai ruoli (es. permission)
            var roles = await userManager.GetRolesAsync(user);
            foreach (var roleName in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, roleName));

                var role = await roleManager.FindByNameAsync(roleName);
                if (role == null) continue;

                var roleClaims = await roleManager.GetClaimsAsync(role);
                foreach (var rc in roleClaims)
                {
                    // Normalizzo i permessi su tipo "permission"
                    if (rc.Type.Equals("permission", StringComparison.OrdinalIgnoreCase))
                    {
                        claims.Add(new Claim("permission", rc.Value));
                    }
                    else
                    {
                        claims.Add(rc);
                    }
                }
            }

            // Rimuovo duplicati identici (same type + same value)
            claims = claims
                .GroupBy(c => (c.Type, c.Value))
                .Select(g => g.First())
                .ToList();

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(configuration["JwtSettings:ExpirationInMinutes"])),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature),
                Audience = configuration["JwtSettings:Audience"],
                Issuer = configuration["JwtSettings:Issuer"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateQRCode(string email, string unformattedKey)
        {
            var issuer = urlEncoder.Encode("Gestionale Bertozzi Two-Factor Auth");
            var account = urlEncoder.Encode(email);
            var secret = urlEncoder.Encode(unformattedKey);

            return string.Format(
                AuthenticatorUriFormat,
                issuer,
                account,
                secret);
        }

        private async Task<string> GeneraRefreshToken(string userId)
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            var refreshToken = Convert.ToBase64String(randomNumber);

            // Scadenza del refresh token (1 giorno)
            var expiryDate = DateTime.UtcNow.AddDays(1);

            var token = new RefreshToken
            {
                Token = refreshToken,
                UserId = userId,
                ExpiryDate = expiryDate,
                CreatedDate = DateTime.UtcNow,
                IsRevoked = false
            };

            db.RefreshTokens.Add(token);
            await db.SaveChangesAsync();

            return refreshToken;
        }
    }
}
