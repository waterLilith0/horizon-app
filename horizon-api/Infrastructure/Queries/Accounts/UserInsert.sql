INSERT INTO horizon.Users
(userName, passwordHash, dev, email, pepperVersion)
VALUES(@userName, @passwordHash, FALSE, @email, @pepperVersion);

SELECT userId, userName, creationDate, dev, email
FROM horizon.SimpleUser
WHERE userId = LAST_INSERT_ID();