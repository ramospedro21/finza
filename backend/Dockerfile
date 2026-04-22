FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "--env-file=.env", "--experimental-strip-types", "src/index.ts"]