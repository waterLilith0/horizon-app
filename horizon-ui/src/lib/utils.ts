import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitIntoColumns<T>(
  items: T[],
  numberOfColumns: number,
): T[][] {
  if (numberOfColumns <= 0) return [];

  const columns: T[][] = Array.from({ length: numberOfColumns }, () => []);

  items.forEach((item, index) => {
    const columnIndex = index % numberOfColumns;
    columns[columnIndex].push(item);
  });

  return columns;
}

export function useResponsiveColumns(): number {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        setColumnCount(3);
      } else if (width >= 1024) {
        setColumnCount(2);
      } else if (width >= 768) {
        setColumnCount(1);
      } else {
        setColumnCount(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return columnCount;
}
