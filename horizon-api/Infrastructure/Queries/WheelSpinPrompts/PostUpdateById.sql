UPDATE horizon.WheelSpinPrompts
	SET promptText=@promptText,collectionId=@collectionId
	WHERE promptId=@promptId;
