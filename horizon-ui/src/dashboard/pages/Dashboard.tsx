import { useState } from "react";
import { useAtom } from "jotai";
import { useUploadContext } from "@uploadcn/react";
import type { RowSelectionState } from "@tanstack/react-table";
import { RiDeleteBinLine, RiDownloadLine } from "@remixicon/react";
import { DeleteDialog } from "@/components/action-dialog";
import { GlobalDropzone, UploadQueuePanel } from "@/components/global-upload";
import { Button } from "@/components/ui/button";
import { plural, withId } from "@/shared/format";
import {
  addCollection,
  createCollection,
  deleteCollection,
} from "../features/collections/collection.ops";
import type { LocalCollection } from "../features/collections/collection.schema";
import CollectionSidebar from "../features/collections/CollectionSidebar";
import DuplicateDialog from "../features/library/DuplicateDialog";
import ImportButton from "../features/library/ImportButton";
import {
  collectionToFile,
  downloadLibraryFile,
  promptsToFile,
} from "../features/library/library.file";
import { libraryAtom } from "../features/library/library.store";
import { useLibraryImport } from "../features/library/useLibraryImport";
import AddPromptForm from "../features/prompts/AddPromptForm";
import PromptCollectionsMenu from "../features/prompts/PromptCollectionsMenu";
import { createPromptColumns } from "../features/prompts/prompt.columns";
import {
  addPrompt,
  deletePrompt,
  setMembership,
  updatePrompt,
} from "../features/prompts/prompt.ops";
import PromptTable from "../features/prompts/PromptTable";
import MissingOnServerNotice from "../features/sync/MissingOnServerNotice";
import PublishButton from "../features/sync/PublishButton";
import { useLibraryAccess } from "../features/sync/sync.access";
import {
  setCollectionPublished,
  setPromptPublished,
} from "../features/sync/sync.upload";
import SyncControls from "../features/sync/SyncControls";
import Page from "../layout/Page";

export default function Dashboard() {
  const [library, setLibrary] = useAtom(libraryAtom);
  // Server actions read the library when they run, not when they are asked for.
  const access = useLibraryAccess();
  const { uploader } = useUploadContext();
  // null picks the view of all prompts, undefined means nothing was picked.
  const [pickedId, setPickedId] = useState<string | null>();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // The prompts waiting for the user to confirm their deletion.
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  // Without a collection, the view lists all prompts. That is also where it
  // falls back to when the picked collection was deleted and none is left.
  const selected =
    pickedId === null
      ? undefined
      : (library.collections.find((c) => c.id === pickedId) ??
        library.collections[0]);
  const prompts = selected
    ? library.prompts.filter((p) => p.collectionIds.includes(selected.id))
    : library.prompts;
  const chosenPrompts = prompts.filter((p) => rowSelection[p.id]);
  const importer = useLibraryImport(selected?.id);

  function handleCreate(name: string) {
    const collection = createCollection(name);
    setLibrary((current) => addCollection(current, collection));
    setPickedId(collection.id);
  }

  // The chosen prompts on their own, or everything in view when none are.
  function handleExport() {
    const scope = selected?.name ?? "All";
    if (chosenPrompts.length) {
      downloadLibraryFile(promptsToFile(chosenPrompts), `${scope} prompts`);
    } else if (selected) {
      downloadLibraryFile(collectionToFile(library, selected), selected.name);
    } else {
      downloadLibraryFile(promptsToFile(prompts), `${scope} prompts`);
    }
  }

  // The bulk actions apply to the chosen prompts, then clear the selection.
  function handleToggleChosen(collectionId: string, member: boolean) {
    const ids = chosenPrompts.map((p) => p.id);
    setLibrary((current) => setMembership(current, ids, collectionId, member));
    setRowSelection({});
  }

  function handleDeleteChosen() {
    const ids = pendingDelete ?? [];
    setLibrary((current) =>
      ids.reduce((next, id) => deletePrompt(next, id), current),
    );
    setPendingDelete(null);
    setRowSelection({});
  }

  async function handleCollectionToggle(collection: LocalCollection) {
    await setCollectionPublished(
      collection.id,
      !collection.public,
      chosenPrompts.map((p) => p.id),
      access,
    );
    setRowSelection({});
  }

  const columns = createPromptColumns(
    {
      updateText: (id, promptText) =>
        setLibrary((current) => updatePrompt(current, id, { promptText })),
      updateType: (id, type) =>
        setLibrary((current) => updatePrompt(current, id, { type })),
      toggleCollection: (id, collectionId, member) =>
        setLibrary((current) =>
          setMembership(current, [id], collectionId, member),
        ),
      publishPrompt: (prompt, isPublic) =>
        setPromptPublished(prompt.id, isPublic, access),
      deletePrompt: (id) => setLibrary((current) => deletePrompt(current, id)),
    },
    { collections: library.collections, showCollection: !selected },
  );

  return (
    <Page
      sidebar={
        <CollectionSidebar
          collections={library.collections}
          selectedId={selected?.id}
          onSelect={setPickedId}
          onSelectAll={() => setPickedId(null)}
          onDelete={(id) =>
            setLibrary((current) => deleteCollection(current, id))
          }
          onCreate={handleCreate}
        />
      }
    >
      <header className="flex w-full items-center justify-between p-2">
        <h1 className="text-xl font-semibold">
          {selected ? withId(selected.name, selected.serverId) : "All prompts"}
        </h1>
        {selected && (
          <PublishButton
            isPublic={selected.public}
            publishLabel={
              chosenPrompts.length
                ? `Publish with ${plural(chosenPrompts.length, "prompt")}`
                : "Publish"
            }
            onToggle={() => handleCollectionToggle(selected)}
          />
        )}
      </header>
      <MissingOnServerNotice />
      <p>table tags</p>
      <PromptTable
        columns={columns}
        data={prompts}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
      <AddPromptForm
        onAdd={(promptText, type) =>
          setLibrary((current) =>
            addPrompt(current, {
              promptText,
              type,
              collectionIds: selected ? [selected.id] : [],
            }),
          )
        }
      />
      <section className="flex flex-row gap-2">
        <ImportButton uploader={uploader}>Import</ImportButton>
        <Button
          variant="secondary"
          disabled={!selected && prompts.length === 0}
          onClick={handleExport}
        >
          <RiDownloadLine />
          {chosenPrompts.length ? "Export prompts" : "Export"}
        </Button>
        {chosenPrompts.length > 0 && (
          <>
            <PromptCollectionsMenu
              label="Collections"
              collections={library.collections}
              isMember={(collectionId) =>
                chosenPrompts.every((p) =>
                  p.collectionIds.includes(collectionId),
                )
              }
              onToggle={handleToggleChosen}
            />
            <Button
              variant="secondary"
              className="text-destructive"
              onClick={() => setPendingDelete(chosenPrompts.map((p) => p.id))}
            >
              <RiDeleteBinLine />
              Delete prompts
            </Button>
          </>
        )}
        <SyncControls />
      </section>
      {importer.error && (
        <p role="alert" className="flex items-center gap-2 text-destructive">
          {importer.error}
          <Button variant="ghost" size="sm" onClick={importer.dismissError}>
            Dismiss
          </Button>
        </p>
      )}
      <DeleteDialog
        open={pendingDelete !== null}
        title="Delete prompts?"
        description={`${plural(pendingDelete?.length ?? 0, "prompt")} will be deleted. This can't be undone.`}
        onConfirm={handleDeleteChosen}
        onCancel={() => setPendingDelete(null)}
      />
      <DuplicateDialog
        duplicates={importer.duplicates}
        onSkip={importer.skipDuplicates}
        onKeepBoth={importer.keepBoth}
        onCancel={importer.cancel}
      />
      <GlobalDropzone />
      <UploadQueuePanel />
    </Page>
  );
}
