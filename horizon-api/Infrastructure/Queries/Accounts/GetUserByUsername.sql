SELECT userId, userName, passwordHash, creationDate, dev, email, pepperVersion
FROM horizon.Users
WHERE userName = @userName;