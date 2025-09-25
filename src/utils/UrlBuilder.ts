import { ApiNode } from "../../generatedSchemas/nodes/ApiNode.ts";
import { AbstractApiNode } from "./AbstractApiNode.ts";

export interface RequestParamsInterface {
  [key: string]: string;
}

export const BuildUrl = (path: string[], params: RequestParamsInterface): string => {
  const used = new Set<string>();

  const pathPart = path
    .map((item) => {
      if (item.startsWith('{') && item.endsWith('}')) {
        const paramKey = item.slice(1, -1); // Remove { and }
        if (paramKey in params) {
          // Check if key exists in params
          used.add(paramKey);
          return params[paramKey]; // Use the parameter value
        } else {
          throw new Error(`Path argument missing: ${paramKey}`);
        }
      } else {
        return item;
      }
    })
    .join('/');

  // Build query string from unused parameters
  const queryParams = Object.keys(params)
    .filter((key) => !used.has(key))
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  return queryParams ? `${pathPart}?${queryParams}` : pathPart;
};


/**
 * Builds the full API tree.
 */
export function buildApiTree(): ApiNode {
  return new ApiNode();
}

/**
 * Traverse tree and collect all endpoints.
 */
export function collectEndpoints(node: AbstractApiNode, list: AbstractApiNode[] = []): AbstractApiNode[] {
  list.push(node);
  for (const key of Object.keys(node)) {
    const child = (node as any)[key];
    if (child instanceof AbstractApiNode) {
      collectEndpoints(child, list);
    }
  }
  return list;
}
