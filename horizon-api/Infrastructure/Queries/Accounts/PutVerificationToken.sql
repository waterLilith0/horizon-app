UPDATE Users
SET verificationTokenHash = @tokenHash,
    verificationExpiresAt = DATE_ADD(UTC_TIMESTAMP(), INTERVAL @hours HOUR)
WHERE userId = @userId;