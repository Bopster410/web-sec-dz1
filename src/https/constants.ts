import fs from 'fs';
import path from 'path';
import { __dirname } from '../constants';

const KEY = fs.readFileSync(path.join(__dirname, 'tls/cert.key'));
const CERT = fs.readFileSync(
    path.join(__dirname, 'tls/certificates/proxy.ru.crt')
);

export { KEY, CERT };
