UPDATE PromptCollections
SET name = @name
WHERE collectionId = @collectionId;

SELECT
    collectionId AS CollectionId,
    name AS Name,
    creationDate AS CreationDate
FROM PromptCollections
WHERE collectionId = @collectionId;