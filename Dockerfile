# ==============================================================================
# SellMyGhar.in - Production Containerfile for Google Cloud Run
# Multi-stage build: compiles Vite frontend and runs production Express server
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies for Linux x64
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy project source
COPY . .

# Compile Vite SPA to dist/
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies & global tsx runtime engine
COPY package.json ./
RUN npm install --legacy-peer-deps --omit=dev && npm install -g tsx

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server and application files
COPY server.ts ./
COPY src ./src
COPY tsconfig.json ./

# Cloud Run defaults to listening on port 8080
EXPOSE 8080

# Run with standard npm start script (executes tsx server.ts)
CMD ["npm", "start"]
