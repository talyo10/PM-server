 FROM readytalk/nodejs

  WORKDIR /app
  ADD package.json /app/
  RUN npm install
  RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
  RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
  RUN apt-get update
  RUN apt-get install -y mongodb-org-*
  RUN apt-get install -y mongodb-org

  RUN service mongod start
  ADD . /app

  CMD []
  ENTRYPOINT ["/nodejs/bin/npm", "start"]
