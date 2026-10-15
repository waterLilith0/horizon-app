namespace horizon_api.Shared
{
    public class Prompt
    {
        public int PromptId { get; set; }
        public required string PromptText { get; set; }
        public required string Type { get; set; }
        public DateTime CreationDate { get; set; }
    }
}
