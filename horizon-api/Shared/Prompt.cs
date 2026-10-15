namespace horizon_api.Shared
{
    public class Prompt
    {
        public int Id { get; set; }
        public int? CollectionId { get; set; } = null;
        public required string Text { get; set; }
    }
}
