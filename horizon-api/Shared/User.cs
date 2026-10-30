namespace horizon_api.Shared
{
    public class User
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = "";
        public string? PasswordHash { get; set; } = "";
        public DateTime CreationDate { get; set; }
        public bool Dev { get; set; }
        public string Email { get; set; } = "";
        public byte PepperVersion { get; set; }
        public bool EmailVerified { get; set; }
    }
}