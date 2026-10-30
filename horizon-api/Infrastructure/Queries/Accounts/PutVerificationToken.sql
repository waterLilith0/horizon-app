UPDATE Users
SET verificationTokenHash = @tokenHash,
    verificationExpiresAt = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
WHERE userId = @userId;