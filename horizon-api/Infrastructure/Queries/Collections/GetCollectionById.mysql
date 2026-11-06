SELECT c.* 
FROM PromptCollections c
WHERE c.collectionId = @collectionId
  AND (c.userId = @userId OR c.`public` = 1);
