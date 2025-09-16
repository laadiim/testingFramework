import * as fs from 'fs';

interface ConfigOptions {
  envName: string;
  baseUrl: string;
  adminKey: string;
  userKey: string;
  invalidKey: string;

  runAuth: boolean;
  runPerf: boolean;
  runFunc: boolean;
  runPost: boolean;
  runPut: boolean;
  runDelete: boolean;
}

export class Config {
  envName: string;
  baseUrl: string;
  adminKey: string;
  userKey: string;
  invalidKey: string;

  runAuth: boolean;
  runPerf: boolean;
  runFunc: boolean;
  runPost: boolean;
  runPut: boolean;
  runDelete: boolean;

  constructor(config: ConfigOptions) {
    this.envName = config.envName;
    this.baseUrl = config.baseUrl;
    this.adminKey = config.adminKey;
    this.userKey = config.userKey;
    this.invalidKey = config.invalidKey;

    this.runAuth = config.runAuth;
    this.runPerf = config.runPerf;
    this.runFunc = config.runFunc;
    this.runPost = config.runPost;
    this.runPut = config.runPut;
    this.runDelete = config.runDelete;
  }

  static load(filePath: string): Config {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw) as ConfigOptions;
    return new Config(json);
  }
}
