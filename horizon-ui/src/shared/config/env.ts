const mode = import.meta.env.MODE;

export const env = {
  mode,
  mocksEnabled:
    import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true",
  faro: {
    enabled: import.meta.env.VITE_FARO_ENABLED === "true",
    url: import.meta.env.VITE_FARO_URL,
    app: { name: "horizon-ui", version: __APP_VERSION__, environment: mode },
  },
};
