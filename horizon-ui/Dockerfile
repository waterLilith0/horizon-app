# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
WORKDIR /app
COPY horizon-ui/package*.json ./
RUN npm ci
COPY horizon-ui/ .
# Build-time settings: the UI is static files, so these are baked into the bundle.
ARG VITE_FARO_ENABLED=false
ARG VITE_FARO_URL=
ARG VITE_APP_ENV=
RUN npm run build

# Stage 2: Production Runtime
FROM nginx:alpine
COPY horizon-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]