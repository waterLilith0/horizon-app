export interface Author {
  id: number | string;
  name: string;
}

// The name is only known for list results, so fall back to the id.
export const authorOf = (item: {
  userId: number | string;
  userName?: string | null;
}): Author => ({
  id: item.userId,
  name: item.userName ?? `user #${item.userId}`,
});
