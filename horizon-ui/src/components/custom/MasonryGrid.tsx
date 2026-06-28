import React from "react";
import { splitIntoColumns } from "@/lib/utils";

interface CardFitterProps {
  columns: number;
  children: React.ReactNode;
}

function MasonryGrid({ columns, children }: CardFitterProps) {
  const allColumnElements: React.ReactNode[] = [];
  const childrenArray = React.Children.toArray(children);

  const allColums = splitIntoColumns(childrenArray, columns);

  allColums.forEach((column, index) => {
    allColumnElements.push(
      <div key={index} className="flex flex-col gap-4">
        {column}
      </div>,
    );
  });

  return <div className="flex gap-4">{allColumnElements}</div>;
}

export default MasonryGrid;
