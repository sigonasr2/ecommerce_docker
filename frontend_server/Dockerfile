FROM node:10.15.0-alpine

WORKDIR /usr/src/app

#COPY . /src/app

#ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ] 