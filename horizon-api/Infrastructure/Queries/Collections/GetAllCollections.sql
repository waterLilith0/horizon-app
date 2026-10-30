SELECT c.* 
FROM PromptCollections c
WHERE c.userId = @userId
   OR c.`public` = 1;
