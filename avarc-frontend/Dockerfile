FROM node:22-alpine

WORKDIR /opt/app

RUN mkdir -p /opt/app

COPY package*.json ./

RUN chown -R node /opt/app

USER node

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
