UPDATE horizon.PromptCollections
	SET name=@newname
	WHERE collectionId=@collectionId;
