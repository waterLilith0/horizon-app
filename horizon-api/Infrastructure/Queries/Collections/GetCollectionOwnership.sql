SELECT COUNT(1) 
FROM CollectionToUser
WHERE collectionId = @collectionId AND userId = @userId;