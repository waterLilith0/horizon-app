INSERT INTO PromptToCollection (collectionId, promptId)
SELECT @collectionId, p.promptId
FROM WheelSpinPrompts p
WHERE p.promptId = @promptId
  AND (p.userId = @userId OR p.`public` = 1);

SELECT CASE WHEN ROW_COUNT() > 0 THEN LAST_INSERT_ID() END;
