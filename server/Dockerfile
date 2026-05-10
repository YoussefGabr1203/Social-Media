FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p uploads/posts uploads/profiles uploads/stories

EXPOSE 5000

CMD ["node", "src/server.js"]
