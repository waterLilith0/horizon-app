namespace horizon_api.Shared
{
    /// <summary>A named group of prompts.</summary>
    public class Collection
    {
        /// <summary>The collection ID.</summary>
        public required long CollectionId { get; set; }

        /// <summary>The collection name.</summary>
        public required string Name { get; set; }

        /// <summary>When the collection was created.</summary>
        public required DateTime CreationDate { get; set; }

        /// <summary>The ID of the user who owns the collection.</summary>
        public required long UserId { get; set; }

        /// <summary>Whether the collection is visible to other users.</summary>
        public required bool Public { get; set; }
    }
}
