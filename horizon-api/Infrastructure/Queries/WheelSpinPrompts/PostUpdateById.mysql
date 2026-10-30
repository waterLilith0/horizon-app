UPDATE WheelSpinPrompts
SET promptText = @PromptText,
	type = @Type,
	`public` = @Public
WHERE promptId = @promptId
  AND userId = @userId;

SELECT
	promptId AS PromptId,
	promptText AS PromptText,
	type AS Type,
	creationDate AS CreationDate,
	userId AS UserId,
	`public` AS Public
FROM WheelSpinPrompts
WHERE promptId = @promptId
  AND userId = @userId;
