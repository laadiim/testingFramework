import { Config } from './config.ts';
import { httpClient } from './httpClient.ts';
import * as fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AbstractApiNode } from '../utils/AbstractApiNode.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function loadSwagger(config: Config): Promise<Object> {
  const contents: string = fs.readFileSync(path.join(__dirname, '../../openapi/swagger.json'), 'utf8');
  return new Promise<Object>(JSON.parse(contents));
}

export async function fetchSwagger(config: Config): Promise<Object> {
  const client: httpClient = new httpClient(config);
  const response = client.client.get('/swagger/v1/swagger.json');
  return response.then((r) => {
    const old: string = fs.readFileSync(path.join(__dirname, '../../openapi/swagger.json'), 'utf8');
    if (old == JSON.stringify(r.data)) {
      console.log('same');
    } else {
      console.log('changed');
      fs.writeFileSync(path.join(__dirname, '../../openapi/swagger.json'), JSON.stringify(r.data));
    }
    return r.data;
  });
}


const parseOutTree = (paths: Object): AbstractApiNode => {

}
