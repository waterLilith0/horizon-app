INSERT INTO WheelSpinPrompts (promptText, type, `public`, userId)
VALUES (@PromptText, @Type, @Public, @UserId);

SET @newPromptId = LAST_INSERT_ID();

INSERT INTO PromptToCollection (collectionId, promptId)
SELECT @CollectionId, @newPromptId
WHERE @CollectionId IS NOT NULL;

SELECT
	promptId AS PromptId,
	promptText AS PromptText,
	type AS Type,
	creationDate AS CreationDate,
	userId AS UserId,
	`public` AS Public
FROM WheelSpinPrompts
WHERE promptId = @newPromptId;
