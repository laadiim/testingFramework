import { Config } from '../src/core/config.ts';
import { getSwagger } from '../src/core/openapiParser.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Correctly resolve relative to the script folder
  const configPath = path.join(__dirname, '../configs/baseConfig.json');
  const config: Config = Config.load(configPath);
  getSwagger(config);
}

main();
