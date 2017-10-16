#install mongodb
cat > /etc/yum.repos.d/mongodb-org.repo << \EOF
[mongodb-org-3.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.2/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.2.asc
EOF
yum install -y mongodb-org
systemctl start mongod

#install nginx
yum install epel-release -y
yum install nginx -y
systemctl start nginx

# install node 6.x
yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -
yum -y install nodejs

# install git
yum install git -y

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