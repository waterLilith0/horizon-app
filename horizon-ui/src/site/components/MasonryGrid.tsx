import React, { useEffect, useState } from "react";
import { splitIntoColumns } from "@/lib/utils";

function MasonryGrid(props: { children: React.ReactNode }) {
  const { children } = props;
  const allColumnElements: React.ReactNode[] = [];
  const childrenArray = React.Children.toArray(children);

  const handleResize = () => {
    const width = window.innerWidth;

    if (width >= 1800) {
      return 3;
    } else if (width >= 1280) {
      return 2;
    } else {
      return 1;
    }
  };

  const [columnCount, setColumnCount] = useState<number>(() => handleResize());

  useEffect(() => {
    const updateColumns = () => setColumnCount(handleResize());

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => {
      window.removeEventListener("resize", updateColumns);
    };
  }, []);

  const allColums = splitIntoColumns(childrenArray, columnCount);

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
