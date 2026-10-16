# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose server port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
