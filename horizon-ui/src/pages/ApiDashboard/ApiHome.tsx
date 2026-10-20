import Collection from "@/components/custom/ApiComponents/Collection";
import {
  columns,
  type PromptValues,
} from "@/components/custom/ApiComponents/Prompt";
import { useOutletContext } from "react-router";

export default function ApiHome() {
  const { selectedCollection } = useOutletContext<{
    selectedCollection: number;
  }>();
  const mockData: PromptValues[] = [
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

  return (
    <>
      <p>// Collectionname placeholder: {`${selectedCollection}`}</p>
      <p>Table creation date, table tags, use ID as table id</p>
      <p>Collection Rename and delete buttons</p>
      <Collection columns={columns} data={mockData} />
    </>
  );
}
