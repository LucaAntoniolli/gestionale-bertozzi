using Hangfire;
using Hangfire.Dashboard;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Identity;
using NemesiAPI.Auth;
using NemesiLIB.Services.Notifiche.Job;
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

            builder.Services.AddHttpContextAccessor();

            // Add services to the container.
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: "NemesiPolicy",
                    builder =>
                    {
                        var frontendUrl = configuration["ApplicationUrls:ApplicationFrontend"];
                        
                        if (string.IsNullOrEmpty(frontendUrl))
                        {
                            // Fallback per ambienti senza configurazione
                            builder
                                .WithOrigins("http://localhost:4200", "http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials()
                                .SetPreflightMaxAge(TimeSpan.FromHours(5));
                        }
                        else
                        {
                            builder
                                .WithOrigins(frontendUrl)
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials()
                                .SetPreflightMaxAge(TimeSpan.FromHours(5));
                        }
                    });
            });

            builder.Services.AddControllers().AddJsonOptions(o => { o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; });

            //Api Explorer and Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Hangfire: schedulazione dei job che generano notifiche.
            // Lo storage vive nello schema "HangFire" del database applicativo, separato
            // dalle tabelle di dominio; l'utente è db_owner, quindi può crearlo da sé.
            builder.Services.AddHangfire(configurazione => configurazione
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UseSqlServerStorage(configuration.GetConnectionString("GestionaleBertozzi"), new SqlServerStorageOptions
                {
                    CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                    SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                    QueuePollInterval = TimeSpan.Zero,
                    UseRecommendedIsolationLevel = true,
                    DisableGlobalLocks = true,
                    PrepareSchemaIfNecessary = true,
                }));

            // Avvia il server che esegue i job all'interno del processo API: il deploy è
            // Kestrel dietro YARP, quindi il processo è a vita lunga e non viene riciclato.
            builder.Services.AddHangfireServer();

            // Register the seeder
            builder.Services.AddScoped<GestionaleBertozziContextSeeder>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.EnvironmentName == "luca" || app.Environment.EnvironmentName == "giacomo")
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("NemesiPolicy");

            // Fix Private Network Access (Chrome/Edge PNA policy)
            app.Use(async (context, next) =>
            {
                if (context.Request.Method == "OPTIONS" &&
                    context.Request.Headers.ContainsKey("Access-Control-Request-Private-Network"))
                {
                    context.Response.Headers.Append("Access-Control-Allow-Private-Network", "true");
                }
                await next();
            });

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            // La dashboard è instradata solo se esplicitamente abilitata in configurazione,
            // e comunque ristretta agli IP elencati. Va raggiunta da localhost sul server
            // (o via tunnel): non va esposta attraverso YARP - vedi
            // HangfireDashboardAuthorizationFilter per il motivo.
            //
            // Va registrata PRIMA di UseAuthorization: è middleware e non un endpoint, e il
            // FallbackPolicy globale (RequireAuthenticatedUser) respinge con 401 anche le
            // richieste che non corrispondono ad alcun endpoint. Si protegge da sé tramite
            // il proprio filtro di autorizzazione.
            if (configuration.GetValue<bool>("Hangfire:Dashboard:Abilitata"))
            {
                app.UseHangfireDashboard("/hangfire", new DashboardOptions
                {
                    Authorization = new[]
                    {
                        new HangfireDashboardAuthorizationFilter(
                            configuration.GetSection("Hangfire:Dashboard:IpConsentiti").Get<string[]>())
                    },
                    // Il default è true e mostrerebbe la connection string, password inclusa.
                    DisplayStorageConnectionString = false,
                });
            }

            // Job ricorrenti. Il cron sta in configurazione, così l'orario si cambia senza
            // ricompilare; il fuso è dichiarato esplicitamente perché il default di Hangfire
            // è UTC e con l'ora legale gli orari slitterebbero di un'ora due volte l'anno.
            RecurringJob.AddOrUpdate<ToDoScaduteJob>(
                "notifiche-todo-scadute",
                job => job.EseguiAsync(CancellationToken.None),
                configuration["Hangfire:Cron:ToDoScadute"] ?? "0 6 * * *",
                new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

            RecurringJob.AddOrUpdate<OreMancantiJob>(
                "notifiche-ore-mancanti",
                job => job.EseguiAsync(CancellationToken.None),
                configuration["Hangfire:Cron:OreMancanti"] ?? "0 6 * * *",
                new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

            // Pulizia settimanale: la crescita è di poche righe al giorno, non serve
            // eseguirla ogni notte. Di domenica, quando non ci sono altri job in corso.
            RecurringJob.AddOrUpdate<PuliziaNotificheJob>(
                "notifiche-pulizia",
                job => job.EseguiAsync(CancellationToken.None),
                configuration["Hangfire:Cron:PuliziaNotifiche"] ?? "30 3 * * 0",
                new RecurringJobOptions { TimeZone = TimeZoneInfo.Local });

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
