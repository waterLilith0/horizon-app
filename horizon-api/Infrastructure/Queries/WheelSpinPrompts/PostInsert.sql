INSERT INTO horizon.WheelSpinPrompts
(promptText, collectionId)
VALUES(@promptText, @collectionId);

SELECT LAST_INSERT_ID();