# Use a minimal Node.js base image
#FROM node:20.14.0-alpine docker pull node:22.12-alpine
FROM node:22.15.0-slim

WORKDIR /app

COPY package.json yarn.lock ./
#RUN yarn
RUN corepack enable yarn
# Install dependencies
# Use --frozen-lockfile to ensure the exact versions in yarn.lock are installed
RUN yarn --immutable
# Copy the rest of the application code
COPY . .

EXPOSE 3004
#key generator
RUN node /app/generateKey.js
# Set the start command
CMD ["yarn", "start"]
