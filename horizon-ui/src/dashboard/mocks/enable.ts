import { env } from "@/shared/config/env.ts";

export async function enableMocks() {
  if (!env.mocksEnabled) return;
  const { worker } = await import("@/dashboard/mocks/browser.ts");
  await worker.start({ onUnhandledFrame: "bypass" });
}
