import Collection from "../features/collections/Collection";
import { createPromptColumns } from "../features/prompts/Prompt";
import { useState } from "react";
import { initialCollections, initialPrompts } from "../mocks/data";
import type { PromptValues } from "../features/prompts/prompt.schema";
import { CustomSidebar } from "../features/collections/CustomSidebar";
import type { CollectionValues } from "../features/collections/collection.schema";
import CustomSidebarTrigger from "../features/collections/CustomSidebarTrigger";

export default function Dashboard() {
  const [prompts, setPrompts] = useState<PromptValues[]>(initialPrompts);

  const [collections, setCollections] =
    useState<CollectionValues[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState(
    initialCollections[0]?.collectionId ?? 0,
  );

  function createCollection(name: string) {
    // TODO: temporary until the actual save functionality is provided
    const collectionId =
      collections.reduce((max, c) => Math.max(max, c.collectionId), -1) + 1;

    setCollections([
      ...collections,
      { collectionId, name, creationDate: new Date() },
    ]);
    setSelectedCollection(collectionId);
  }

  function deleteCollection(id: number) {
    const remaining = collections.filter((c) => c.collectionId !== id);
    setCollections(remaining);
    if (id === selectedCollection) {
      setSelectedCollection(remaining[0]?.collectionId ?? 0);
    }
  }

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
    <main className="flex flex-col bg-secondary items-center grow shrink">
      <section className="flex flex-col items-center bg-primary w-[85%] p-2 overflow-hidden">
        <CustomSidebarTrigger />
        <CustomSidebar
          collections={collections}
          selectedId={selectedCollection}
          onSelect={setSelectedCollection}
          onDelete={deleteCollection}
          onCreate={createCollection}
        />
        // TODO: Replace placeholder with actual collection name and details
        <p>// Collectionname placeholder: {`${selectedCollection}`}</p>
        <p>table tags</p>
        <Collection columns={columns} data={prompts} />
        <section>
          <p>
            Placeholder for export and import functions of individual prompts
          </p>
        </section>
      </section>
    </main>
  );
}
