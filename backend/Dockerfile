FROM node:20-slim

# System dependencies required by Chromium (Puppeteer)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Download Puppeteer's Chromium during build (cached layer)
RUN npx puppeteer browsers install chrome

# Copy source
COPY src/ ./src/

# Runtime dirs (Railway uses ephemeral disk; videos live for the request lifetime)
RUN mkdir -p /app/output /app/temp

ENV NODE_ENV=production
ENV OUTPUT_DIR=/app/output
ENV TEMP_DIR=/app/temp

EXPOSE 3001

CMD ["node", "src/index.js"]
