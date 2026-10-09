import { clsx, type ClassValue } from "clsx";
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
