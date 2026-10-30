import * as z from "zod";

export const CollectionNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or fewer");

export const CollectionSchema = z.object({
  collectionId: z.int(),
  name: CollectionNameSchema,
  creationDate: z.date(),
});

export type CollectionValues = z.infer<typeof CollectionSchema>;
