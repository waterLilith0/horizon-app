INSERT INTO horizon.Users
(userName, passwordHash, dev, email, pepperVersion)
VALUES(@userName, @passwordHash, @dev, @email, @pepperVersion);

SELECT userId, userName, creationDate, dev, email
FROM horizon.SimpleUser;