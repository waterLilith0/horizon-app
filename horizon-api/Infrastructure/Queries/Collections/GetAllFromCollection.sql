SELECT
    p.promptId AS PromptId,
    p.promptText AS PromptText,
    p.type AS Type,
    p.creationDate AS CreationDate
FROM WheelSpinPrompts p
INNER JOIN PromptToCollection ptc ON ptc.promptId = p.promptId
WHERE ptc.collectionId = @collectionId;