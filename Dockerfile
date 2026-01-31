FROM node:22-alpine

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm install

COPY . .

expose 5000
CMD ["npm", "start"]