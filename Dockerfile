FROM node:alpine
USER root
RUN apk add openssl
RUN apk add ca-certificates
RUN mkdir -p /usr/local/share/ca-certificates
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm install
COPY --chown=node:node . .
WORKDIR /home/node/app/src
RUN /home/node/app/src/tls/genca.sh
RUN update-ca-certificates
RUN openssl req -new -sha256 -key /home/node/app/src/tls/cert.key -subj "/CN=proxy.ru" | openssl x509 -req -days 500 -CA /home/node/app/src/tls/rootCA.crt -CAkey /home/node/app/src/tls/rootCA.key -set_serial "134234123" -out /home/node/app/src/tls/certificates/proxy.ru.crt