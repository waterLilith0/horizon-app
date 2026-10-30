namespace horizon_api.Infrastructure.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string ApiKey { get; set; } = "";
    public string ApiSecret { get; set; } = "";
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "Horizon";
    public string VerificationUrl { get; set; } = "";

    public EmailTemplates Templates { get; set; } = new();

    public sealed class EmailTemplates
    {
        public long Verification { get; set; }
        public long PasswordReset { get; set; }
    }
}