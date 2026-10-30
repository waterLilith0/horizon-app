SELECT
	p.promptId AS PromptId,
	p.promptText AS PromptText,
	p.type AS Type,
	p.creationDate AS CreationDate,
	p.userId AS UserId,
	p.`public` AS Public
FROM WheelSpinPrompts p
WHERE p.promptId = @promptId
  AND (p.userId = @userId OR p.`public` = 1);
