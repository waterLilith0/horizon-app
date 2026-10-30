UPDATE WheelSpinPrompts
SET `public` = 1
WHERE promptId = @promptId
  AND userId = @userId;

SELECT promptId, promptText, type, creationDate, userId, `public`
FROM WheelSpinPrompts
WHERE promptId = @promptId
  AND userId = @userId;
