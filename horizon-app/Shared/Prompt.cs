namespace horizonapi.Shared
{
    public class Prompt
    {
        public int PromptId { get; set; }
        public string PromptText { get; set; } = string.Empty;
        public int? CollectionId { get; set; } = null;
    }
}
