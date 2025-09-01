# Use a minimal Node.js base image
#FROM node:20.14.0-alpine docker pull node:22.12-alpine
ARG NODE_VERSION=22.15.0
FROM node:22.15.1-alpine
#FROM node:${NODE_VERSION}-alpine

WORKDIR /app

#COPY package.json yarn.lock ./
#RUN yarn
RUN npm install -g corepack
#Use Yarn Modern (v2+)
RUN corepack enable
# Install dependencies
# Use --frozen-lockfile to ensure the exact versions in yarn.lock are installed
#RUN yarn --immutable
# Copy the rest of the application code
COPY . .
RUN yarn install --immutable

EXPOSE 3004
#key generator
RUN node /app/generateKey.js
# Set the start command
CMD ["yarn", "start"]
