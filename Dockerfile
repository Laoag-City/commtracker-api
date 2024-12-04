# Use a minimal Node.js base image
# node 22 needed for some modules pdfjs, etc.
FROM docker pull node:22.12.0-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn
COPY . .

EXPOSE 3004
#key generator
RUN node /app/generateKey.js
# Set the start command
CMD ["yarn", "start"]
