using Hangfire.Dashboard;
using System.Net;

namespace NemesiAPI.Auth
{
    /// <summary>
    /// Autorizza l'accesso alla dashboard di Hangfire confrontando l'IP del chiamante con
    /// una lista esplicita definita in configurazione. Nega per impostazione predefinita.
    /// <para>
    /// Non si usa <c>LocalRequestsOnlyAuthorizationFilter</c>: dietro un reverse proxy
    /// (YARP) l'indirizzo che Kestrel vede è quello del proxy, quindi quel filtro
    /// considererebbe locale ogni richiesta, lasciando la dashboard aperta a chiunque.
    /// </para>
    /// <para>
    /// Per lo stesso motivo, se la dashboard viene resa raggiungibile attraverso il proxy
    /// non basta aggiungere qui l'IP del proxy - equivarrebbe a consentire tutti. Serve
    /// prima <c>UseForwardedHeaders</c> configurato con i proxy attendibili, in modo che
    /// l'indirizzo confrontato sia quello reale del client.
    /// </para>
    /// </summary>
    public class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
    {
        private readonly IReadOnlyCollection<IPAddress> indirizziConsentiti;

        public HangfireDashboardAuthorizationFilter(IEnumerable<string>? indirizziConsentiti)
        {
            this.indirizziConsentiti = (indirizziConsentiti ?? Enumerable.Empty<string>())
                .Select(voce => IPAddress.TryParse(voce, out var indirizzo) ? indirizzo : null)
                .Where(indirizzo => indirizzo != null)
                .Select(indirizzo => indirizzo!)
                .ToList();
        }

        public bool Authorize(DashboardContext context)
        {
            if (indirizziConsentiti.Count == 0)
                return false;

            var indirizzoChiamante = context.GetHttpContext().Connection.RemoteIpAddress;
            if (indirizzoChiamante == null)
                return false;

            // Kestrel espone gli IPv4 in forma mappata su IPv6 (::ffff:127.0.0.1):
            // senza normalizzare, il confronto con "127.0.0.1" fallirebbe.
            if (indirizzoChiamante.IsIPv4MappedToIPv6)
                indirizzoChiamante = indirizzoChiamante.MapToIPv4();

            return indirizziConsentiti.Any(consentito => consentito.Equals(indirizzoChiamante));
        }
    }
}
