UPDATE horizon.PromptCollections
	SET name=@name
	WHERE collectionId=@collectionId;

SELECT * 
FROM collections 
WHERE collectionId = @collectionId;