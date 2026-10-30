-- Mirrors the production schema; keep in sync with the real database when it changes.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ApiKeys;
DROP TABLE IF EXISTS CollectionToTag;
DROP TABLE IF EXISTS PromptToCollection;
DROP TABLE IF EXISTS PromptToTag;
DROP TABLE IF EXISTS WheelSpinPrompts;
DROP TABLE IF EXISTS PromptCollections;
DROP TABLE IF EXISTS Tags;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `Users` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `passwordHash` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dev` tinyint(1) DEFAULT '0',
  `email` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `pepperVersion` smallint unsigned NOT NULL DEFAULT '1',
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `verificationTokenHash` binary(32) DEFAULT NULL,
  `verificationExpiresAt` datetime DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `Users_email_IDX` (`email`) USING BTREE,
  UNIQUE KEY `Users_userName_IDX` (`userName`) USING BTREE,
  KEY `IX_Users_verificationTokenHash` (`verificationTokenHash`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Tags` (
  `tagId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tagId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PromptCollections` (
  `collectionId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  `userId` int NOT NULL,
  PRIMARY KEY (`collectionId`),
  KEY `PromptCollections_Users_FK` (`userId`),
  CONSTRAINT `PromptCollections_Users_FK` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `WheelSpinPrompts` (
  `promptId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `promptText` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  `userId` int NOT NULL,
  PRIMARY KEY (`promptId`),
  KEY `WheelSpinPrompts_Users_FK` (`userId`),
  CONSTRAINT `WheelSpinPrompts_Users_FK` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `ApiKeys` (
  `apiId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `keyHash` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dev` tinyint(1) DEFAULT '0',
  `userId` int NOT NULL,
  PRIMARY KEY (`apiId`),
  KEY `ApiKeys_Users_FK` (`userId`),
  CONSTRAINT `ApiKeys_Users_FK` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `CollectionToTag` (
  `entryId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `collectionId` bigint unsigned NOT NULL,
  `tagId` bigint unsigned NOT NULL,
  PRIMARY KEY (`entryId`),
  KEY `CollectionToTag_Tags_FK` (`tagId`),
  KEY `CollectionToTag_PromptCollections_FK` (`collectionId`),
  CONSTRAINT `CollectionToTag_PromptCollections_FK` FOREIGN KEY (`collectionId`) REFERENCES `PromptCollections` (`collectionId`) ON DELETE CASCADE,
  CONSTRAINT `CollectionToTag_Tags_FK` FOREIGN KEY (`tagId`) REFERENCES `Tags` (`tagId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PromptToCollection` (
  `entryId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `collectionId` bigint unsigned DEFAULT NULL,
  `promptId` bigint unsigned DEFAULT NULL,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entryId`),
  UNIQUE KEY `uq_collection_prompt` (`collectionId`, `promptId`),
  KEY `PromptToCollection_WheelSpinPrompts_FK` (`promptId`),
  KEY `PromptToCollection_PromptCollections_FK` (`collectionId`),
  CONSTRAINT `PromptToCollection_PromptCollections_FK` FOREIGN KEY (`collectionId`) REFERENCES `PromptCollections` (`collectionId`) ON DELETE CASCADE,
  CONSTRAINT `PromptToCollection_WheelSpinPrompts_FK` FOREIGN KEY (`promptId`) REFERENCES `WheelSpinPrompts` (`promptId`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PromptToTag` (
  `entryId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `creationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `promptId` bigint unsigned NOT NULL,
  `tagId` bigint unsigned NOT NULL,
  PRIMARY KEY (`entryId`),
  KEY `PromptToTag_WheelSpinPrompts_FK` (`promptId`),
  KEY `PromptToTag_Tags_FK` (`tagId`),
  CONSTRAINT `PromptToTag_Tags_FK` FOREIGN KEY (`tagId`) REFERENCES `Tags` (`tagId`),
  CONSTRAINT `PromptToTag_WheelSpinPrompts_FK` FOREIGN KEY (`promptId`) REFERENCES `WheelSpinPrompts` (`promptId`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- Users referenced by the tests: 1 owns test data, 2 acts as a different user
INSERT INTO Users (userId, userName, passwordHash, email) VALUES
  (1, 'test-owner', 'x', 'owner@example.com'),
  (2, 'test-other', 'x', 'other@example.com');
