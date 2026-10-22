UPDATE PromptCollections c
JOIN CollectionToUser cu ON cu.collectionId = c.collectionId
SET c.name = @name
WHERE c.collectionId = @collectionId 
AND cu.userId = @userId;

SELECT c.* FROM PromptCollections c
WHERE c.collectionId = @collectionId;