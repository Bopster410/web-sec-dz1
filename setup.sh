docker-compose down
docker-compose build
docker-compose up --detach
rm ./rootCA.crt
docker cp node-proxy-proxy-1:/home/node/app/src/tls/rootCA.crt .