INSERT INTO horizon.PromptCollections
(name)
VALUES(@name);

SELECT LAST_INSERT_ID();