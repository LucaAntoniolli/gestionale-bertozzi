using Microsoft.AspNetCore.Identity;
using NemesiCOMMONS;
using NemesiLIB;
using NemesiLIB.Context.Seeders;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace NemesiAPI
{
    public class Program
    {
        public async static Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var configuration = builder.Configuration;

            // Add services to the container.
            // common services
            builder.Services.RegisterCommonServices();

            // data services
            builder.Services.RegisterDataServices();

            // security services
            builder.Services.RegisterSecurityServices();

            // Add services to the container.
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: "NemesiPolicy",
                    builder =>
                    {
                        builder
                            .WithOrigins("*")
                            .AllowAnyHeader()
                            .AllowAnyMethod();
                    });
            });

            builder.Services.AddControllers().AddJsonOptions(o => { o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; });

            //Api Explorer and Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Register the seeder
            builder.Services.AddScoped<GestionaleBertozziContextSeeder>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.EnvironmentName == "luca")
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("NemesiPolicy");
            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Seed the database
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();
                try
                {
                    var seeder = services.GetRequiredService<GestionaleBertozziContextSeeder>();
                    await seeder.SeedRuoli();
                    await seeder.SeedRolePermissions();
                    await seeder.SeedFirstUser();
                    await seeder.SeedTipologieCommesse();
                    await seeder.SeedStatusCommesse();

                    logger.LogInformation("Database seeding completed successfully.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred while seeding the database.");
                }
            }

           

            app.Run();
        }
    }
}