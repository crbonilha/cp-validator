ARG SOME_ARG

FROM node:10.13.0-alpine
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD SOME_ARG=$SOME_ARG node index.js
