SELECT
	p.promptId AS PromptId,
	p.promptText AS PromptText,
	p.type AS Type,
	p.creationDate AS CreationDate,
	p.userId AS UserId,
	p.`public` AS Public
FROM WheelSpinPrompts p
WHERE (p.userId = @userId OR p.`public` = 1)
  AND (@collectionId IS NULL
	   OR (p.promptId IN (
			   SELECT ptc.promptId
			   FROM PromptToCollection ptc
			   WHERE ptc.collectionId = @collectionId
		   )
		   AND EXISTS (
			   SELECT 1
			   FROM PromptCollections c
			   WHERE c.collectionId = @collectionId
				 AND (c.userId = @userId OR c.`public` = 1)
		   )))
ORDER BY RAND()
LIMIT 1;
