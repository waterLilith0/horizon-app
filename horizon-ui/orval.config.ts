import { defineConfig } from "orval";

const api = (name: "public" | "internal", mock = false) => ({
  input: { target: `http://localhost:5079/api/openapi/${name}.json` },
  output: {
    mode: "split" as const,
    target: `./src/api/generated/${name}/`,
    schemas: {
      path: `./src/api/generated/${name}/schemas`,
      type: "zod" as const,
    },
    client: "react-query" as const,
    httpClient: "fetch" as const,
    mock,
  },
});

export default defineConfig({
  public: api("public", true),
  internal: api("internal"),
});
