import { useOutletContext } from "react-router";
import {
  createPromptColumns,
  type PromptValues,
} from "../features/collections/Prompt";
import Collection from "../features/collections/Collection";
import { useCallback, useMemo, useState } from "react";

export default function ApiHome() {
  const { selectedCollection } = useOutletContext<{
    selectedCollection: number;
  }>();

  const initialPrompts: PromptValues[] = [
    {
      promptId: 0,
      promptText: "Test",
      type: "action",
      creationDate: new Date("01-10-2026"),
    },
    {
      promptId: 1,
      promptText: "Test",
      type: "question",
      creationDate: new Date(),
    },
  ];
  const [prompts, setPrompts] = useState<PromptValues[]>(initialPrompts);

  const updateText = useCallback((id: number, promptText: string) => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.promptId === id ? { ...prompt, promptText } : prompt,
      ),
    );
  }, []);

  const updateType = useCallback((id: number, type: PromptValues["type"]) => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.promptId === id ? { ...prompt, type } : prompt,
      ),
    );
  }, []);

  const deletePrompt = useCallback((id: number) => {
    setPrompts((current) => current.filter((prompt) => prompt.promptId !== id));
  }, []);

  const columns = useMemo(
    () => createPromptColumns({ updateText, updateType, deletePrompt }),
    [updateText, updateType, deletePrompt],
  );

  return (
    <>
      <p>// Collectionname placeholder: {`${selectedCollection}`}</p>
      <p>Table creation date, table tags, use ID as table id</p>
      <p>Collection Rename and delete buttons</p>
      <Collection columns={columns} data={prompts} />
    </>
  );
}
