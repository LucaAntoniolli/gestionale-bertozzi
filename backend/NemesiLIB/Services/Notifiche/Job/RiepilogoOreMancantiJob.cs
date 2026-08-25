using log4net;
using Microsoft.EntityFrameworkCore;
using NemesiCommons.Models;
using NemesiCOMMONS.Services;
using NemesiLIB.Context;
using System.Net;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Invia al Backoffice il riepilogo di chi non ha caricato le ore nella settimana.
    /// <para>
    /// Usa la stessa rilevazione del promemoria in-app, così le due comunicazioni non
    /// possono raccontare cose diverse. Cambiano solo destinatari e cadenza: qui il
    /// riepilogo è settimanale, perché è un controllo di gestione e non un sollecito.
    /// </para>
    /// </summary>
    public class RiepilogoOreMancantiJob
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const string RuoloDestinatario = "Backoffice";
        private const string NomeTemplate = "riepilogo-ore-mancanti";

        private readonly RilevatoreOreMancanti rilevatore;
        private readonly INotificaService notificaService;
        private readonly GestionaleBertozziContext dbContext;
        private readonly IMailService mailService;

        public RiepilogoOreMancantiJob(
            RilevatoreOreMancanti rilevatore,
            INotificaService notificaService,
            GestionaleBertozziContext dbContext,
            IMailService mailService)
        {
            this.rilevatore = rilevatore;
            this.notificaService = notificaService;
            this.dbContext = dbContext;
            this.mailService = mailService;
        }

        /// <returns>Quante mail sono state inviate con esito positivo.</returns>
        public async Task<int> EseguiAsync(CancellationToken ct = default)
        {
            var rilevazione = await rilevatore.RilevaAsync(ct);

            if (rilevazione.Utenti.Count == 0)
            {
                // Nessuna mail quando è tutto in regola: un riepilogo vuoto ogni settimana
                // insegnerebbe solo a ignorare il messaggio.
                log.Info("Riepilogo ore mancanti: nessuno scoperto, nessuna mail inviata");
                return 0;
            }

            var destinatari = await DestinatariAsync(ct);
            if (destinatari.Count == 0)
            {
                log.Warn($"Riepilogo ore mancanti: nessun utente con ruolo {RuoloDestinatario} e indirizzo valido");
                return 0;
            }

            var periodo = $"{rilevazione.Inizio:dd/MM/yyyy} - {rilevazione.Fine:dd/MM/yyyy}";
            var tabella = ComponiTabella(rilevazione);

            var inviate = 0;

            foreach (var destinatario in destinatari)
            {
                var mailData = new MailData
                {
                    EmailSubject = $"Ore non caricate - {periodo}",
                    EmailToId = destinatario.Email,
                    EmailTypeName = NomeTemplate,
                    TemplateValues = new Dictionary<string, string>
                    {
                        ["Periodo"] = periodo,
                        ["NumeroUtenti"] = rilevazione.Utenti.Count.ToString(),
                    },
                    // La tabella è markup e va nel canale che il MailService sanitizza
                    // invece di codificare, altrimenti arriverebbe come testo coi tag in vista.
                    TemplateHtmlValues = new Dictionary<string, string>
                    {
                        ["Tabella"] = tabella,
                    },
                };

                var esito = await mailService.SendHTMLMailAsync(mailData);

                if (esito.Esito)
                    inviate++;
                else
                    log.Error($"Riepilogo ore mancanti non inviato a {destinatario.Email}: {esito.Errore}");
            }

            log.Info($"Riepilogo ore mancanti: {inviate} mail inviate su {destinatari.Count} destinatari, {rilevazione.Utenti.Count} persone scoperte");
            return inviate;
        }

        private async Task<List<(string Nominativo, string Email)>> DestinatariAsync(CancellationToken ct)
        {
            var idDestinatari = await notificaService.DestinatariPerRuoloAsync(RuoloDestinatario, ct);
            if (idDestinatari.Count == 0)
                return new List<(string, string)>();

            return await dbContext.Users.AsNoTracking()
                .Where(u => idDestinatari.Contains(u.Id) && u.Email != null && u.Email != "")
                .Select(u => new ValueTuple<string, string>(u.Nominativo, u.Email!))
                .ToListAsync(ct);
        }

        // Stili inline e non classi: il sanitizer del MailService rimuove l'attributo
        // class, che non è fra quelli consentiti, e la tabella arriverebbe senza formato.
        private const string StileCella = "padding:10px 12px;border-bottom:1px solid #dddddd;vertical-align:top;";
        private const string StileCellaGiorni = StileCella + "text-align:center;font-weight:bold;white-space:nowrap;";
        private const string StileIntestazione = "text-align:left;padding:10px 12px;background-color:#007bff;color:#ffffff;font-weight:bold;";

        /// <summary>
        /// Compone la tabella completa, non le sole righe: il sanitizer analizza il
        /// frammento con un parser HTML, e <c>tr</c> o <c>td</c> fuori da una
        /// <c>table</c> sono invalidi e vengono scartati lasciando solo il testo.
        /// <para>
        /// I valori dal database vengono codificati esplicitamente: qui si costruisce
        /// markup, e il canale HTML del MailService sanitizza ma non codifica.
        /// </para>
        /// </summary>
        public static string ComponiTabella(RilevazioneOreMancanti rilevazione)
        {
            var righe = rilevazione.Utenti.Select(utente =>
            {
                var nominativo = WebUtility.HtmlEncode(utente.Nominativo ?? string.Empty);
                var date = string.Join(", ", utente.GiorniMancanti.Select(g => g.ToString("dd/MM")));

                return $"<tr>" +
                       $"<td style=\"{StileCella}\">{nominativo}</td>" +
                       $"<td style=\"{StileCellaGiorni}\">{utente.GiorniMancanti.Count}</td>" +
                       $"<td style=\"{StileCella}\">{date}</td>" +
                       $"</tr>";
            });

            return "<table style=\"border-collapse:collapse;width:100%;font-size:15px;\">" +
                   "<thead><tr>" +
                   $"<th style=\"{StileIntestazione}\">Persona</th>" +
                   $"<th style=\"{StileIntestazione}text-align:center;\">Giorni</th>" +
                   $"<th style=\"{StileIntestazione}\">Date scoperte</th>" +
                   "</tr></thead><tbody>" +
                   string.Join(string.Empty, righe) +
                   "</tbody></table>";
        }
    }
}
