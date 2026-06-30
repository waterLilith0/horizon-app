SELECT *
FROM WheelSpinPrompts
WHERE (@collectionId IS NULL OR collectionId = @collectionId);