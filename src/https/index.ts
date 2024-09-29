import fs from 'fs';
import http from 'http';
import tls, { SecureContext } from 'tls';
import { KEY, CERT } from './constants';
import { spawn } from 'child_process';
import internal from 'stream';
import path from 'path';
import { __dirname } from '../constants';

type Callback = (error: Error | null, ctx: SecureContext) => void;

const options: tls.TLSSocketOptions = {
    key: KEY,
    cert: CERT,
    SNICallback: SNICallback,
    isServer: true,
};

const certificates = new Map<string, string>();
fs.readdirSync(path.join(__dirname, 'tls/certificates/')).forEach((file) => {
    certificates.set(
        file.substring(0, file.length - 4),
        fs
            .readFileSync(path.join(__dirname, 'tls/certificates/') + file)
            .toString()
    );
});

function createSecureContext(certificate: any) {
    return tls.createSecureContext({
        cert: certificate,
        key: KEY,
    });
}

function SNICallback(servername: string, callback: Callback) {
    if (certificates.has(servername)) {
        let ctx = createSecureContext(certificates.get(servername));
        callback(null, ctx);
        return;
    }

    generateCert(servername, callback);
}

function generateCert(servername: string, callback: Callback) {
    console.log(`gen cert ${servername}`);
    try {
        const gen_cert = spawn(
            './gencert.sh',
            [servername, Math.floor(Math.random() * 1000000000000).toString()],
            { cwd: '/home/node/app/src/tls', shell: true }
        );

        let certData = '';

        gen_cert.stdout.on('data', (data) => {
            certData += data.toString();
        });

        gen_cert.on('close', (code) => {
            if (code !== 0) {
                console.error(
                    `An error occured while generating certificate with code: ${code}`
                );
                return;
            }

            certificates.set(servername, certData);
            let ctx = createSecureContext(certData);
            fs.writeFile(
                path.join(__dirname, `tls/certificates/${servername}.crt`),
                certData,
                (err) => {
                    if (err) {
                        console.log(
                            'An error occured while saving certificate: ',
                            err.message
                        );
                    }
                }
            );
            callback(null, ctx);
        });
    } catch (error) {
        console.log(error);
    }
}

export function handleHttps(
    req: http.IncomingMessage,
    clientSocket: internal.Duplex,
    head: Buffer
) {
    console.log('https');
    const [hostname, port] = req.url?.split(':') ?? [null, null];
    if (hostname === null || port === null) return;
    console.log(hostname);
    const serverSocket = tls.connect(
        {
            port: Number(port) || 443,
            host: hostname,
        },
        () => {
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            console.log('connected');

            const tlsSocket = new tls.TLSSocket(clientSocket, options);
            tlsSocket.pipe(serverSocket).pipe(tlsSocket);
        }
    );
}
