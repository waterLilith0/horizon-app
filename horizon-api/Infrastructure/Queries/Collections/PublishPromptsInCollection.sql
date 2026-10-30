UPDATE WheelSpinPrompts p
JOIN PromptToCollection pc ON pc.promptId = p.promptId
SET p.`public` = 1
WHERE pc.collectionId = @collectionId
  AND p.userId = @userId;
