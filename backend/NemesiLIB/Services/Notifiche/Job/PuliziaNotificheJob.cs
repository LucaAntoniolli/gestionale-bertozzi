using log4net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NemesiLIB.Context;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Cancella le notifiche già lette più vecchie della finestra di retention.
    /// <para>
    /// Con i controlli ricorrenti la tabella cresce di una riga al giorno per utente, e le
    /// notifiche lette non sono più consultabili da nessuno: restano solo come storico.
    /// </para>
    /// <para>
    /// Le non lette non vengono toccate a nessuna età: sono la posta dell'utente, e
    /// cancellarle significherebbe fargli sparire qualcosa che non ha mai visto. Quelle
    /// generate dai controlli ricorrenti si chiudono comunque da sé per sostituzione.
    /// </para>
    /// </summary>
    public class PuliziaNotificheJob
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const int MesiRetentionPredefiniti = 6;

        private readonly GestionaleBertozziContext dbContext;
        private readonly IConfiguration configuration;

        public PuliziaNotificheJob(GestionaleBertozziContext dbContext, IConfiguration configuration)
        {
            this.dbContext = dbContext;
            this.configuration = configuration;
        }

        public async Task<int> EseguiAsync(CancellationToken ct = default)
        {
            var mesi = configuration.GetValue<int?>("Notifiche:MesiRetention") ?? MesiRetentionPredefiniti;

            if (mesi <= 0)
            {
                log.Warn($"Pulizia notifiche saltata: retention configurata a {mesi} mesi");
                return 0;
            }

            // La finestra deve restare più ampia del periodo nelle chiavi di deduplica,
            // altrimenti cancellare una riga vecchia farebbe risorgere una notifica che
            // l'utente aveva già chiuso. Le chiavi dei job sono giornaliere: sei mesi
            // lasciano un margine ampissimo.
            var soglia = DateTime.UtcNow.AddMonths(-mesi);

            // Una riga marcata letta senza DataLettura - per esempio da SQL diretto - non
            // deve restare a database per sempre: in quel caso vale la data di creazione.
            var cancellate = await dbContext.Notifica
                .Where(n => n.IsLetta
                         && (n.DataLettura != null ? n.DataLettura < soglia : n.DataCreazione < soglia))
                .ExecuteDeleteAsync(ct);

            log.Info($"Pulizia notifiche: {cancellate} righe cancellate (lette prima del {soglia:yyyy-MM-dd})");
            return cancellate;
        }
    }
}
