import Collection from "../features/collections/Collection";
import { useOutletContext } from "react-router";
import { createPromptColumns } from "../features/prompts/Prompt";
import { useState } from "react";
import { initialPrompts } from "../mocks/data";
import type { PromptValues } from "../features/prompts/prompt.schema";

export default function Dashboard() {
  const { selectedCollection } = useOutletContext<{
    selectedCollection: number;
  }>();

  const [prompts, setPrompts] = useState<PromptValues[]>(initialPrompts);

  const updateText = (id: number, promptText: string) => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.promptId === id ? { ...prompt, promptText } : prompt,
      ),
    );
  };

  const updateType = (id: number, type: PromptValues["type"]) => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.promptId === id ? { ...prompt, type } : prompt,
      ),
    );
  };

  const deletePrompt = (id: number) => {
    setPrompts((current) => current.filter((prompt) => prompt.promptId !== id));
  };

  const columns = createPromptColumns({ updateText, updateType, deletePrompt });

  return (
    <>
      // TODO: Replace placeholder with actual collection name and details
      <p>// Collectionname placeholder: {`${selectedCollection}`}</p>
      <p>Table creation date, table tags, use ID as table id</p>
      <p>Collection Rename and delete buttons</p>
      <Collection columns={columns} data={prompts} />
    </>
  );
}
