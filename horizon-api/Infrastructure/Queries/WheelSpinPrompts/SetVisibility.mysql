UPDATE WheelSpinPrompts
SET `public` = @public
WHERE promptId = @promptId
  AND userId = @userId;

SELECT promptId, promptText, type, creationDate, userId, `public`
FROM WheelSpinPrompts
WHERE promptId = @promptId
  AND userId = @userId;
