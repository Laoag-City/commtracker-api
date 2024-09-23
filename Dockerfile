# Use a minimal Node.js base image
FROM node:20.14.0-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn
COPY . .

EXPOSE 3002
#key generator
RUN node /app/generateKey.js
# Set the start command
CMD ["yarn", "start"]
