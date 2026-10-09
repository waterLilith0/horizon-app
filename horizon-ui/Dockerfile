# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY horizon-ui/package*.json ./
RUN npm ci
COPY horizon-ui/ .
RUN npm run build

# Stage 2: Production Runtime
FROM nginx:alpine
COPY horizon-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]