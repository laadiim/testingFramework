// src/core/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Config } from './config.ts';

// Load config once
export class httpClient {
  /**
   * Create a configured axios instance
   */
  config: Config;

  client: AxiosInstance;

  constructor(config: Config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.userKey}`, // default role = user
      },
    });
  }
  /**
   * Helpers to switch auth tokens
   */
  useAdminAuth(): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${this.config.adminKey}`;
  }

  useUserAuth(): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${this.config.userKey}`;
  }

  useInvalidAuth(): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${this.config.invalidKey}`;
  }
}
