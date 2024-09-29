import http from 'http';
import express from 'express';
import { performRequest } from './http';
import bodyParser from 'body-parser';
import { handleHttps } from './https';

const app = express();
app.set('etag', false);
app.set('x-powered-by', false);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('/', async (req, res) => {
    console.log('http');
    try {
        const { status, body } = await performRequest(req);
        res.status(status).send(body);
    } catch (error) {
        res.status(500).send(error);
    }
});

const httpServer = http.createServer(app);

httpServer.on('connect', handleHttps);

httpServer.listen(8080, () => {
    console.log('Proxy is running on localhost:8080');
});
