import Collection from "@/components/custom/ApiComponents/Collection";
import { columns, type Prompt } from "@/components/custom/ApiComponents/Prompt";

export default function ApiHome() {
  const mockData = [
    {
      promptId: 1,
      promptText: "Test",
      type: "question",
      creationDate: new Date("01-10-2026"),
    } as Prompt,
  ];

  return (
    <>
      <Collection columns={columns} data={mockData} />
      <p>ApiHome</p>
    </>
  );
}
