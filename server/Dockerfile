FROM node:carbon

# Create app directory
WORKDIR /app
COPY package*.json ./

RUN npm install
RUN npm install -g sails
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
RUN apt-get update
RUN echo "Installing mongoDB"
RUN apt-get install -y mongodb-org-*
RUN apt-get install -y mongodb-org

RUN echo "Starting mongod service"
RUN service mongod start

COPY . .


EXPOSE 8080

CMD [ "npm", "start" ]
ENTRYPOINT ["/nodejs/bin/npm", "start"]
