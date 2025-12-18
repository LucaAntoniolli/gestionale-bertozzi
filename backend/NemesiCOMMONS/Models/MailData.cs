namespace NemesiCommons.Models
{
    public class MailData
    {
        public string EmailToId { get; set; }
        public string EmailSubject { get; set; }
        public string EmailBody { get; set; }
        public string EmailTypeName { get; set; }

        //Valori nominati per il template
        public Dictionary<string, string>? TemplateValues { get; set; }
        public Dictionary<string, string>? TemplateHtmlValues { get; set; }
    }
}
