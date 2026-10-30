DELETE FROM WheelSpinPrompts
WHERE promptId = @promptId
  AND userId = @userId;