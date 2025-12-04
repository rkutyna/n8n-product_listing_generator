# Build stage for React
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage (Node.js Server)
FROM node:18-alpine
WORKDIR /app

# Copy package.json and install production dependencies (express, etc.)
COPY package*.json ./
RUN npm install --production

# Copy server code
COPY server ./server

# Copy React build from build stage
COPY --from=build /app/dist ./dist

# Create directory for uploads (will be mounted)
RUN mkdir -p /usr/share/nginx/html/files

EXPOSE 3002
CMD ["node", "server/index.cjs"]
