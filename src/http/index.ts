import { Request } from 'express';
import { Socket } from 'net';
import { RequestResponse } from './types';
import { isObjectEmpty } from '../utils';
import { PROXY_CONNECTION_HEADER, CONTENT_TYPE, PORT } from './constants';

const socket = new Socket();

// Construct request string
function constructRequest(request: Request) {
    const relativeUrl = request.originalUrl.split(request.hostname)[1];
    const headers: string[] = [];
    Object.entries(request.headers).forEach(([header, value]) => {
        if (typeof value === 'string' && header !== PROXY_CONNECTION_HEADER)
            headers.push(`${header}: ${value}`);
    });

    return `${request.method} ${relativeUrl} HTTP/1.1\r\n${headers.join(
        '\r\n'
    )}\r\n\r\n${
        request.body && !isObjectEmpty(request.body)
            ? JSON.stringify(request.body)
            : ''
    }`;
}

// Parses response into object
function parseResponse(rawResponse: string) {
    const [head, body] = rawResponse.split('\r\n\r\n');
    let status = 502;

    const headers = new Headers();
    head.split('\n').forEach((line, index) => {
        if (index === 0) {
            status = Number(line.split(' ')[1]);
            return;
        }

        const [header, value] = line.split(': ');
        headers.append(header, value);
    });

    return {
        body:
            headers.get('content-type') === CONTENT_TYPE.JSON
                ? JSON.parse(body)
                : body,
        status,
        headers,
    };
}

// Performs request
export async function performRequest(request: Request) {
    socket.connect(PORT, request.hostname);

    return new Promise<RequestResponse>((resolve, reject) => {
        socket.on('connect', () => {
            // console.log('-----connected-------');
            const stringRequest = constructRequest(request);
            console.log(stringRequest);
            socket.write(stringRequest);
        });

        socket.on('data', (data) => {
            // console.log('-----data-------');
            const response = parseResponse(data.toString());
            resolve(response);
        });

        socket.on('error', (data) => {
            reject({ status: 500, body: data.message });
        });
    });
}
