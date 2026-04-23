# Dockerfile Frontend Oses
# ===== DEVELOPMENT =====
FROM node:18-alpine
WORKDIR /app
# Copy dependencies file
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy seluruh source code
COPY . .
# React dev server default
EXPOSE 3000
# Start React development server
CMD ["npm", "start"]