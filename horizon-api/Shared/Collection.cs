namespace horizon_api.Shared
{
    public class Collection
    {
        public int CollectionId { get; set; }
        public required string Name { get; set; }
        public DateTime CreationDate { get; set; }
        public int UserId { get; set; }
        public bool Public { get; set; }
    }
}
