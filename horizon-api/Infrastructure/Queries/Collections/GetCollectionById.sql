SELECT
    collectionId AS CollectionId,
    name AS Name,
    creationDate AS CreationDate
FROM PromptCollections
WHERE collectionId = @collectionId;