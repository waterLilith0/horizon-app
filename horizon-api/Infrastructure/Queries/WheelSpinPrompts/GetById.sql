SELECT *
FROM WheelSpinPrompts
WHERE (@promptId IS NULL OR promptId = @promptId)
AND (@collectionId IS NULL OR collectionId = @collectionId);