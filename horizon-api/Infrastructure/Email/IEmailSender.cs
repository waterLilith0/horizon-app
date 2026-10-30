namespace horizon_api.Infrastructure.Email;

public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null, CancellationToken cancellationToken = default);

    Task SendTemplateAsync(string toEmail, long templateId, IReadOnlyDictionary<string, object?> variables, string? subject = null, CancellationToken cancellationToken = default);
}