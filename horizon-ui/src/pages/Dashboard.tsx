import { DataTable } from "@/components/DataTable";
import { getGetApiPromptPromptIdResponseMock } from "@/api/generated/public/horizonAPI.msw";
import { useMemo } from "react";
import { faker } from "@faker-js/faker";
import { promptActionColumns } from "@/features/prompts/prompt.tablecolumns.actions";
import { selectionColumn } from "@/features/shared.selectioncolumns";
import { promptColumns } from "@/features/prompts/prompt.tablecolumns";

export const PROMPT_TYPES = ["question", "action", "group-action", "partner"];

export default function Dashboard() {
  const MOCK_PROMPT_COUNT = 100;
  const data = useMemo(
    () =>
      Array.from({ length: MOCK_PROMPT_COUNT }, () => ({
        ...getGetApiPromptPromptIdResponseMock(),
        type: faker.helpers.arrayElement(PROMPT_TYPES),
      })),
    [],
  );

  console.log(data);

  return (
    <>
      <p>this is just a test so far</p>
      <DataTable
        columns={[...selectionColumn, ...promptColumns, ...promptActionColumns]}
        data={data}
      />
    </>
  );
}
