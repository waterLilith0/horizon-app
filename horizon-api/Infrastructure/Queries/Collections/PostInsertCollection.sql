INSERT INTO PromptCollections (name) 
VALUES (@name);
SELECT LAST_INSERT_ID();