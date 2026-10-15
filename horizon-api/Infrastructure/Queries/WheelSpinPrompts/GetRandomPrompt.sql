SELECT
    p.promptId AS PromptId,
    p.promptText AS PromptText,
    p.type AS Type,
    p.creationDate AS CreationDate
FROM WheelSpinPrompts p
WHERE @collectionId IS NULL
   OR p.promptId IN (
        SELECT ptc.promptId
        FROM PromptToCollection ptc
        WHERE ptc.collectionId = @collectionId
   )
ORDER BY RAND()
LIMIT 1;