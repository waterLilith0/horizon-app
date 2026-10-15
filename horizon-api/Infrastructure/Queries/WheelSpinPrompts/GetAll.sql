WITH OrderedPrompts AS (
    SELECT
        promptId AS PromptId,
        promptText AS PromptText,
        type AS Type,
        creationDate AS CreationDate,
        ROW_NUMBER() OVER (ORDER BY promptId) AS RowNumber
    FROM WheelSpinPrompts
)
SELECT
    PromptId,
    PromptText,
    Type,
    CreationDate
FROM OrderedPrompts
WHERE @resultAmount IS NULL OR RowNumber <= @resultAmount
ORDER BY RowNumber;
