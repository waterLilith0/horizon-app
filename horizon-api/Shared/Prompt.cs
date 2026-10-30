namespace horizon_api.Shared
{
    /// <summary>A prompt that can be added to collections.</summary>
    public class Prompt
    {
        /// <summary>The prompt ID.</summary>
        public required long PromptId { get; set; }

        /// <summary>The prompt text.</summary>
        public required string PromptText { get; set; }

        /// <summary>The prompt category.</summary>
        public required string Type { get; set; }

        /// <summary>When the prompt was created.</summary>
        public required DateTime CreationDate { get; set; }

        /// <summary>The ID of the user who owns the prompt.</summary>
        public required long UserId { get; set; }

        /// <summary>Whether the prompt is visible to other users.</summary>
        public required bool Public { get; set; }

        /// <summary>IDs of the collections the prompt belongs to. Only set when requested.</summary>
        [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
        public IReadOnlyList<long>? CollectionIds { get; set; }
    }
}
