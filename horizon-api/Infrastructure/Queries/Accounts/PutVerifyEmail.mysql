UPDATE Users
SET emailVerified = 1,
    verificationTokenHash = NULL,
    verificationExpiresAt = NULL
WHERE verificationTokenHash = @tokenHash
  AND verificationExpiresAt > UTC_TIMESTAMP();