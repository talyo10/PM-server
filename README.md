# Productionmap


## Docker installation
### Install with mongoDB
```
cd server
docker-compose build
docker-compose up
```

### Install without mongoDB
```
cd server
docker build -t pm .
docker run -p 8080:8080 pm
```


* Optional variables:
    * MONGO_HOST (default 'localhost')
    * MONGO_PORT (default 27017)
