FROM node:carbon

# Create app directory
WORKDIR /app
COPY package*.json ./

RUN npm install
RUN npm install -g sails


COPY . .

EXPOSE 8080

CMD ["npm", "start"]
