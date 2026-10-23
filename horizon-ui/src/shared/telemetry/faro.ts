import {
  getWebInstrumentations,
  initializeFaro,
  ReactIntegration,
  createReactRouterV7DataOptions,
} from "@grafana/faro-react";
import { matchRoutes } from "react-router";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { env } from "../config/env";

export function initTelemetry() {
  if (!env.faro.enabled) return;
  initializeFaro({
    url: env.faro.url,
    app: env.faro.app,
    sessionTracking: {
      samplingRate: 0.4,
    },
    instrumentations: [
      ...getWebInstrumentations(),
      new TracingInstrumentation(),
      new ReactIntegration({
        router: createReactRouterV7DataOptions({
          matchRoutes,
        }),
      }),
    ],
  });
}
