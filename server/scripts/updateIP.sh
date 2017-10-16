export IPADDR=$1
sed -i "s/localhost/$IPADDR/g" production-map-server/assets/index.html
sed -i "s/localhost/$IPADDR/g" production-map-server/assets/main.bundle.js
