const mode = import.meta.env.MODE;

export const env = {
  mode,
  mocksEnabled:
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true",
  faro: {
    enabled: import.meta.env.VITE_FARO_ENABLED === "true",
    url: import.meta.env.VITE_FARO_URL as string,
    app: {
      name: "horizon-ui",
      version: __APP_VERSION__,
      // `mode` is "production" for every deployed branch, so the pipeline sets this.
      environment: (import.meta.env.VITE_APP_ENV as string) || mode,
    },
  },
};
