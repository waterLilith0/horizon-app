import { createColumnHelper } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/components/table-features";
import type { Prompt } from "@/api/generated/public/schemas";
import OwnedActions from "@/components/OwnedAction";
import OtherAction from "@/components/OtherAction";

const columnHelper = createColumnHelper<DataTableFeatures, Prompt>();

export const promptActionColumns = columnHelper.columns([
  columnHelper.display({
    id: "actions",
    cell: () => {
      const owned = true;

      return (
        <div className="shrink">
          {owned ? <OwnedActions /> : <OtherAction />}
        </div>
      );
    },
  }),
]);
