UPDATE PromptCollections
SET `public` = 1
WHERE collectionId = @collectionId
  AND userId = @userId;

SELECT *
FROM PromptCollections
WHERE collectionId = @collectionId
  AND userId = @userId;
