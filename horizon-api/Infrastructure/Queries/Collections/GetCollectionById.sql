SELECT c.* 
FROM PromptCollections c
JOIN CollectionToUser cu ON cu.collectionId = c.collectionId
WHERE c.collectionId = @collectionId 
AND cu.userId = @userId;;