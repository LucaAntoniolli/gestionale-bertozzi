namespace NemesiCOMMONS.Models
{
    public class MailSendResult
    {
        public MailSendResult(bool esito, string errore = null)
        {
            Esito = esito;
            Errore = errore;
        }

        public bool Esito { get; set; }
        public string? Errore { get; set; }
    }
}
