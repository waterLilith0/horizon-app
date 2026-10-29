import { defineConfig } from "orval";

export default defineConfig({
  public: {
    input: {
      target: "http://localhost:5079/api/openapi/public.json",
    },
    output: {
      target: "./src/api/generated/public",
      client: "react-query",
      httpClient: "fetch",
    },
  },
  internal: {
    input: {
      target: "http://localhost:5079/api/openapi/internal.json",
    },
    output: {
      target: "./src/api/generated/internal",
      client: "react-query",
      httpClient: "fetch",
    },
  },
});
