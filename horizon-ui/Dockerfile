# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:25-alpine AS builder
WORKDIR /app
COPY horizon-ui/package*.json ./
RUN npm ci
COPY horizon-ui/ .
# Build-time settings: the UI is static files, so these are baked into the bundle.
ARG VITE_FARO_ENABLED=false
ARG VITE_FARO_URL=
ARG VITE_APP_ENV=
ARG VITE_BLOG_URL
ARG FARO_UPLOAD_ENDPOINT
ARG FARO_APP_ID
ARG FARO_STACK_ID
ARG FARO_GIT_HASH
# The API key is a build secret so it never ends up in an image layer.
RUN --mount=type=secret,id=faro_api_key FARO_API_KEY="$(cat /run/secrets/faro_api_key 2>/dev/null)" npm run build \
    && find dist -name "*.map" -delete

# Stage 2: Production Runtime
FROM nginx:alpine
COPY horizon-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]