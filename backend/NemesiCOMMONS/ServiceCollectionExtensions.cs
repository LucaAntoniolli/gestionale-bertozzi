using log4net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NemesiCOMMONS.Models;
using NemesiCOMMONS.Services;

namespace NemesiCOMMONS
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection RegisterCommonServices(this IServiceCollection services)
        {
            var provider = services.BuildServiceProvider();

            var Configuration = provider.GetRequiredService<IConfiguration>();
            var Environment = provider.GetRequiredService<IHostEnvironment>();

            // Logging
            var loggerFactory = provider.GetRequiredService<ILoggerFactory>();
            var log4NetOptions = new Log4NetProviderOptions();
            GlobalContext.Properties["environment"] = Environment.EnvironmentName;

            log4NetOptions.Log4NetConfigFileName = $@"log4net.config";
            loggerFactory.AddLog4Net(log4NetOptions);

            LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType).Info($"registrazione dei servizi [DI] comuni");

            //Email
            services.Configure<MailSettings365>(setting =>
                Configuration.GetSection("MailSettings").Bind(setting)
            );
            services.AddTransient<IMailService, MailService>();

            return services;
        }
    }
}
