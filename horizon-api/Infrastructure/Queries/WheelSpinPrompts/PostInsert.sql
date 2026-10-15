INSERT INTO WheelSpinPrompts (promptText, type)
VALUES (@PromptText, @Type);

SET @newPromptId = LAST_INSERT_ID();

INSERT INTO PromptToCollection (collectionId, promptId)
SELECT @CollectionId, @newPromptId
WHERE @CollectionId IS NOT NULL;

SELECT
    promptId AS PromptId,
    promptText AS PromptText,
    type AS Type,
    creationDate AS CreationDate
FROM WheelSpinPrompts
WHERE promptId = @newPromptId;