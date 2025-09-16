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
