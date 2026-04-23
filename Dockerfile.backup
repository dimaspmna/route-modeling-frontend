# STAGE 1: Build Environment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies saja untuk memanfaatkan cache docker
COPY package*.json ./
RUN npm ci

# Copy source code dan build aplikasi
COPY . .
RUN npm run build

# STAGE 2: Production Environment (Nginx)
FROM nginx:stable-alpine

# Copy hasil build dari stage pertama ke folder Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy konfigurasi Nginx untuk React SPA (handle client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy dan set permission entrypoint script untuk inject ENV saat runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 (standard Nginx)
EXPOSE 80

# Jalankan entrypoint untuk inject ENV lalu start Nginx
CMD ["/docker-entrypoint.sh"]