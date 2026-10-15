INSERT INTO PromptToCollection (collectionId, promptId)
VALUES (@collectionId, @promptId);

SELECT LAST_INSERT_ID();