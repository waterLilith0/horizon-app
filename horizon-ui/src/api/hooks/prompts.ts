import {
  useGetApiPromptPromptId,
  usePostApiPrompt,
  useGetApiPrompt,
} from "@/api/generated/public/horizonAPI";

export const usePromptById = (promptId: number) => {
  return useGetApiPromptPromptId(promptId, {
    query: { enabled: promptId > 0 },
  });
};

export const useCreatePrompt = () => {
  return usePostApiPrompt();
};

export const usePrompts = () => {
  return useGetApiPrompt();
};
