#install mongodb
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
apt-get update
apt-get install -y mongodb-org

apt-get install nginx

# install node 6.x
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs

# install git
apt-get install -y git

#install npm dependencies
npm i -g sails forever

#create pm folder
mkdir -p /var/production-map
cd /var/production-map

#clone server
git clone -b develop https://github.com/ProductionMap/production-map-server.git
cd production-map-server/production-map-server
npm i
forever start app.js --prod

export IPADDR="$(curl ipinfo.io/ip)"
sed -i "s/localhost/$IPADDR/g" assets/index.html
sed -i "s/localhost/$IPADDR/g" assets/main.bundle.js

cp -r assets/* /usr/share/nginx/html/
