SELECT c.* 
FROM PromptCollections c
WHERE (@scope = 'all' AND (c.userId = @userId OR c.`public` = 1))
   OR (@scope = 'owned' AND c.userId = @userId)
   OR (@scope = 'others' AND c.userId <> @userId AND c.`public` = 1);
