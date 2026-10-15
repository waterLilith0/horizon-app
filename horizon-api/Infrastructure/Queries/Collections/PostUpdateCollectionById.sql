UPDATE horizon.PromptCollections
	SET name=@name
	WHERE collectionId=@collectionId;

SELECT * 
FROM horizon.PromptCollections
WHERE collectionId = @collectionId;