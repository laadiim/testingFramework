import { Config } from './config.ts';
import { httpClient } from './httpClient.ts';
import * as fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getSwagger(config: Config) {
  const client: httpClient = new httpClient(config);
  const response = client.client.get('/swagger/v1/swagger.json');
  response.then((r) => {
    console.log(r.data);
    const old: string = fs.readFileSync(path.join(__dirname, '../../openapi/swagger.json'), 'utf8');
    if (old == JSON.stringify(r.data)) {
      console.log('same');
    } else {
      console.log('changed');
      fs.writeFileSync(path.join(__dirname, '../../openapi/swagger.json'), JSON.stringify(r.data));
    }
  });
}


const parseOutTree = (paths: Object):
