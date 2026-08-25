using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NemesiLIB.Context;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Services.Notifiche;
using NemesiLIB.Services.Notifiche.Eventi;

namespace NemesiLIB
{
    public static class ServiceCollectionExtensions
    {
        private static readonly log4net.ILog log = log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        public static IServiceCollection RegisterDataServices(
            this IServiceCollection services
            )
        {
            log.Info($"Registrazione dei servizi dati");
            var provider = services.BuildServiceProvider();

            var Configuration = provider.GetRequiredService<IConfiguration>();
            var Environment = provider.GetRequiredService<IHostEnvironment>();

            // database GestionaleBertozzi
            services.AddDbContext<GestionaleBertozziContext>(o =>
            {
                o.UseSqlServer(Configuration.GetConnectionString("GestionaleBertozzi"));
            });

            // notifiche
            services.AddScoped<INotificaService, NotificaService>();
            services.AddScoped<INotificheToDoService, NotificheToDoService>();

            return services;
        }
    }
}
