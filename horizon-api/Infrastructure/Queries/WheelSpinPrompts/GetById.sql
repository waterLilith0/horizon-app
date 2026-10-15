SELECT
    promptId AS PromptId,
    promptText AS PromptText,
    type AS Type,
    creationDate AS CreationDate
FROM WheelSpinPrompts
WHERE promptId = @promptId;