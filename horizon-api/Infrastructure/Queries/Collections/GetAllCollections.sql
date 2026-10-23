SELECT c.* 
FROM PromptCollections c
JOIN CollectionToUser cu ON cu.collectionId = c.collectionId
WHERE cu.userId = @userId;