UPDATE PromptCollections
SET name = @name,
	`public` = @public
WHERE collectionId = @collectionId
  AND userId = @userId;

SELECT *
FROM PromptCollections
WHERE collectionId = @collectionId
  AND userId = @userId;
