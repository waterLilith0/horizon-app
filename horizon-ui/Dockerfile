# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
WORKDIR /app
COPY horizon-ui/package*.json ./
RUN npm ci
COPY horizon-ui/ .
RUN --mount=type=secret,id=faro_api_key,required=true FARO_API_KEY="$(cat /run/secrets/faro_api_key)" npm run build

# Stage 2: Production Runtime
FROM nginx:alpine
COPY horizon-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]