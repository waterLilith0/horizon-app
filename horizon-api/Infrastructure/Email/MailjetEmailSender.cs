using Microsoft.Extensions.Options;

namespace horizon_api.Infrastructure.Email;

public sealed class MailjetEmailSender(
    HttpClient http,
    IOptions<EmailOptions> options,
    ILogger<MailjetEmailSender> logger) : IEmailSender
{
    private readonly EmailOptions _options = options.Value;

    public Task SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken cancellationToken = default)
    {
        var message = new Dictionary<string, object?>
        {
            ["From"] = new { Email = _options.FromAddress, Name = _options.FromName },
            ["To"] = new[] { new { Email = toEmail } },
            ["Subject"] = subject,
            ["TextPart"] = textBody,
            ["HTMLPart"] = htmlBody
        };

        return PostAsync(message, cancellationToken);
    }

    public Task SendTemplateAsync(string toEmail, long templateId, IReadOnlyDictionary<string, object?> variables, string? subject = null, CancellationToken cancellationToken = default)
    {
        var message = new Dictionary<string, object?>
        {
            ["From"] = new { Email = _options.FromAddress, Name = _options.FromName },
            ["To"] = new[] { new { Email = toEmail } },
            ["TemplateID"] = templateId,
            ["TemplateLanguage"] = true,
            ["Variables"] = variables,
            ["TemplateErrorReporting"] = new { Email = _options.FromAddress },
            ["TemplateErrorDeliver"] = true
        };

        if (subject is not null)
        {
            message["Subject"] = subject;
        }

        return PostAsync(message, cancellationToken);
    }

    private async Task PostAsync(Dictionary<string, object?> message, CancellationToken cancellationToken)
    {
        var payload = new { Messages = new[] { message } };

        using var response = await http.PostAsJsonAsync("v3.1/send", payload, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError("Mailjet send failed with status {StatusCode}: {Body}", (int)response.StatusCode, body);
            throw new InvalidOperationException("Failed to send email.");
        }

        logger.LogInformation("Email sent via Mailjet");
    }
}
