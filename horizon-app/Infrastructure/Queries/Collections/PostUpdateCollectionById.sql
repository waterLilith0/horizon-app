UPDATE horizon.PromptCollections
	SET name=@name
	WHERE collectionId=@collectionId;
