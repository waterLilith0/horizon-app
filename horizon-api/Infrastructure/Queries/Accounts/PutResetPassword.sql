UPDATE Users
SET passwordHash = @passwordHash,
    pepperVersion = @pepperVersion,
    emailVerified = 1,
    verificationTokenHash = NULL,
    verificationExpiresAt = NULL
WHERE verificationTokenHash = @tokenHash
  AND verificationExpiresAt > UTC_TIMESTAMP();