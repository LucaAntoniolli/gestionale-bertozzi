using log4net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using NemesiCommons.Models;
using NemesiCOMMONS.Models;
using Newtonsoft.Json;
using System.Net;
using System.Net.Http.Headers;
using System.Reflection;
using Ganss.Xss;

namespace NemesiCOMMONS.Services
{
    public interface IMailService
    {
        bool SendMail(MailData mailData);
        Task<MailSendResult> SendMailAsync(MailData mailData);
        Task<MailSendResult> SendHTMLMailAsync(MailData mailData);
    }
    public class MailService : IMailService
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private static string EMAIL_TEMPLATES_FOLDER = "\\Templates\\Emails\\";
        private readonly MailSettings365 mailSettings;
        private readonly IConfiguration configuration;
        private readonly IConfidentialClientApplication confidentialClientApplication;
        private readonly string[] scopes;
        private readonly string graphEndpoint;


        public MailService(IOptions<MailSettings365> mailSettings, IConfiguration configuration)
        {
            this.mailSettings = mailSettings.Value;
            this.configuration = configuration;

            var config = new
            {
                // Full directory URL, in the form of https://login.microsoftonline.com/<tenant_id>
                Authority = $"https://login.microsoftonline.com/{this.mailSettings.TenantId}",
                // 'Enter the client ID obtained from the Microsoft Entra Admin Center
                ClientId = this.mailSettings.ClientId,
                // Client secret 'Value' (not its ID) from 'Client secrets' in the Microsoft Entra Admin Center
                ClientSecret = this.mailSettings.ClientSecret,
                // Client 'Object ID' of app registration in Microsoft Entra Admin Center - this value is a GUID
                ClientObjectId = this.mailSettings.ClientObjectId
            };

            confidentialClientApplication = ConfidentialClientApplicationBuilder.Create(config.ClientId)
                    .WithClientSecret(config.ClientSecret)
                    .WithAuthority(new Uri(config.Authority))
                    .Build();

            scopes = new string[] {
                "https://graph.microsoft.com/.default"
            };

            graphEndpoint = "https://graph.microsoft.com/v1.0";
        }
        public async Task<bool> SendMail(MailData mailData)
        {
            log.Info($"invio mail a {mailData.EmailToId}");
            try
            {
                var result = await Send(mailData);
                return result.Esito;
            }
            catch (Exception ex)
            {
                log.Error($"eccezione invio mail a {mailData.EmailToId}", ex);
                return false;
            }
        }

        public async Task<MailSendResult> SendMailAsync(MailData mailData)
        {
            log.Info($"invio mail a {mailData.EmailToId} (async)");
            try
            {
                var result = await Send(mailData);
                return result;
            }
            catch (Exception ex)
            {
                log.Error($"eccezione invio mail a {mailData.EmailToId} (async)", ex);
                return new MailSendResult(false, ex.Message);
            }
        }

        public async Task<MailSendResult> SendHTMLMailAsync(MailData mailData)
        {
            log.Info($"invio HTML mail a {mailData.EmailToId} (async)");
            try
            {
                string filePath = Directory.GetCurrentDirectory() + EMAIL_TEMPLATES_FOLDER + mailData.EmailTypeName + ".html";
                string emailTemplateHtml = File.ReadAllText(filePath);

                var sanitizer = new HtmlSanitizer();

                // Verifico se ho i dati da inserire nella mail
                if (mailData.TemplateValues != null && mailData.TemplateValues.Count > 0)
                {
                    // Encode
                    foreach (var kv in mailData.TemplateValues)
                    {
                        var placeholder = "{{" + kv.Key + "}}";
                        var encoded = WebUtility.HtmlEncode(kv.Value ?? string.Empty);
                        emailTemplateHtml = emailTemplateHtml.Replace(placeholder, encoded);
                    }
                }

                if (mailData.TemplateHtmlValues != null && mailData.TemplateHtmlValues.Count > 0)
                {
                    foreach (var kv in mailData.TemplateHtmlValues)
                    {
                        var placeholder = "{{" + kv.Key + "}}";
                        var safeHtml = sanitizer.Sanitize(kv.Value ?? string.Empty);
                        emailTemplateHtml = emailTemplateHtml.Replace(placeholder, safeHtml);
                    }
                }

                mailData.EmailBody = emailTemplateHtml;
                var result = await Send(mailData);
                return result;
            }
            catch (Exception ex)
            {
                log.Error($"eccezione invio HTML mail a {mailData.EmailToId} (async)", ex);
                return new MailSendResult(false, ex.Message);
            }
        }

        private async Task<MailSendResult> Send(MailData mailData)
        {
            log.Info($"invio mail");
            try
            {
                var authTokenResult = await confidentialClientApplication.AcquireTokenForClient(scopes).ExecuteAsync();
                var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authTokenResult.AccessToken);

                var graphEmailMessage = new
                {
                    message = new
                    {
                        subject = mailData.EmailSubject,
                        body = new
                        {
                            contentType = "Html",
                            content = mailData.EmailBody
                        },
                        toRecipients = new[]
                        {
                            new
                            {
                                emailAddress = new
                                {
                                    address = mailData.EmailToId
                                }
                            }
                        }
                    }
                };

                // Convert the email message to a JSON string and send the email via Microsoft Graph
                var jsonMessage = JsonConvert.SerializeObject(graphEmailMessage);
                var response = await httpClient.PostAsync($"{graphEndpoint}/users/{this.mailSettings.SenderEmail}/sendMail", new StringContent(jsonMessage, System.Text.Encoding.UTF8, "application/json"));

                if (response.IsSuccessStatusCode)
                {
                    return new MailSendResult(true);
                }
                else
                {
                    log.Error($"Errore nell'invio mail:" + response.StatusCode);
                    return new MailSendResult(false, "Failed to send email. Status code: " + response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                log.Error($"eccezione invio mail", ex);
                return new MailSendResult(false, ex.Message);
            }
        }

        bool IMailService.SendMail(MailData mailData)
        {
            throw new NotImplementedException();
        }
    }
}
