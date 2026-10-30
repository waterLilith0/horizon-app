UPDATE WheelSpinPrompts p
JOIN PromptToCollection pc ON pc.promptId = p.promptId
SET p.`public` = @public
WHERE pc.collectionId = @collectionId
  AND p.userId = @userId;
