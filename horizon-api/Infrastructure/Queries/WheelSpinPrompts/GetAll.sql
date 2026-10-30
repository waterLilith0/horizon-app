WITH OrderedPrompts AS (
	SELECT
		p.promptId AS PromptId,
		p.promptText AS PromptText,
		p.type AS Type,
		p.creationDate AS CreationDate,
		p.userId AS UserId,
		p.`public` AS Public,
		ROW_NUMBER() OVER (ORDER BY p.promptId) AS RowNumber
	FROM WheelSpinPrompts p
	WHERE p.userId = @userId
	   OR p.`public` = 1
)
SELECT PromptId, PromptText, Type, CreationDate, UserId, Public
FROM OrderedPrompts
WHERE @resultAmount IS NULL OR RowNumber <= @resultAmount
ORDER BY RowNumber;
