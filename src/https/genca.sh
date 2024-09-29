openssl genrsa -out /home/node/app/src/tls/rootCA.key 2048
openssl req -x509 -new -days 3650 -key /home/node/app/src/tls/rootCA.key -out /home/node/app/src/tls/rootCA.crt -subj "/CN=epic proxyCA"
openssl genrsa -out /home/node/app/src/tls/cert.key 2048
mkdir /home/node/app/src/tls/certificates/