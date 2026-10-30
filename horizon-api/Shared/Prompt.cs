namespace horizon_api.Shared
{
    /// <summary>A prompt that can be added to collections.</summary>
    public class Prompt
    {
        /// <summary>The prompt ID.</summary>
        public required int PromptId { get; set; }

        /// <summary>The prompt text.</summary>
        public required string PromptText { get; set; }

        /// <summary>The prompt category.</summary>
        public required string Type { get; set; }

        /// <summary>When the prompt was created.</summary>
        public required DateTime CreationDate { get; set; }

        /// <summary>The ID of the user who owns the prompt.</summary>
        public required int UserId { get; set; }

        /// <summary>Whether the prompt is visible to other users.</summary>
        public required bool Public { get; set; }
    }
}
