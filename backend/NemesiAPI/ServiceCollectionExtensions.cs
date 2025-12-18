using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model;
using System.Net;
using System.Text;

namespace NemesiAPI
{
    public static class ServiceCollectionExtensions
    {
        private static readonly log4net.ILog log = log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public static IServiceCollection RegisterSecurityServices(this IServiceCollection services)
        {
            log.Info($"registrazione dei servizi [DI] di sicurezza");

            var provider = services.BuildServiceProvider();

            var Configuration = provider.GetRequiredService<IConfiguration>();
            var Environment = provider.GetRequiredService<IHostEnvironment>();

            //Identity, authentication and authorization
            services.AddIdentity<Utente, IdentityRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 12;
            })
                .AddEntityFrameworkStores<GestionaleBertozziContext>()
                .AddDefaultTokenProviders();

            services.Configure<DataProtectionTokenProviderOptions>(opt =>
                opt.TokenLifespan = TimeSpan.FromDays(1));

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = Configuration["JwtSettings:Issuer"],
                        ValidAudience = Configuration["JwtSettings:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["JwtSettings:Key"]))
                    };
                });

            services.AddAuthorization(options =>
            {
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            });

            // Register dynamic permission policy provider and handler
            // (implementati in NemesiAPI\Auth\PermissionPolicyProvider.cs, PermissionRequirement.cs, PermissionHandler.cs)
            services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
            services.AddScoped<IAuthorizationHandler, PermissionHandler>();

            services.ConfigureApplicationCookie(options =>
            {
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    return Task.CompletedTask;
                };
            });

            return services;

        }
    }
}
