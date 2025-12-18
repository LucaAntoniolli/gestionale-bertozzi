namespace NemesiCOMMONS.Models
{
    public class MailSettingsSMTP
    {
        public string Server { get; set; }
        public int Port { get; set; }
        public string SenderName { get; set; }
        public string SenderEmail { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
    }
    
    public class MailSettings365
    {
        public string SenderEmail { get; set; }
        public string TenantId { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string ClientObjectId { get; set; }
    }
}
