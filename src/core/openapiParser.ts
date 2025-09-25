import { Config } from './config.ts';
import { httpClient } from './httpClient.ts';
import * as fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AbstractApiNode } from '../utils/AbstractApiNode.ts';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function loadSwagger(config: Config): Promise<Object> {
  return new Promise<Object>((resolve, reject) => {
    try {
      const contents: string = fs.readFileSync(
        path.join(__dirname, "../../openapi/swagger.json"),
        "utf8"
      );
      const parsed = JSON.parse(contents);
      resolve(parsed);
    } catch (err) {
      reject(err);
    }
  });
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

type Swagger = {
  paths: Record<string, any>;
  components?: { schemas?: Record<string, any> };
};

/**
 * Tree structure for API nodes
 */
type Node = {
  name: string; // e.g. "club", "{clubId}"
  methods: Record<string, any>; // HTTP verbs with params
  status: Record<string, any>;  // response mapping
  children: Record<string, Node>;
};

function buildTree(swagger: Swagger): Node {
  const root: Node = { name: "api", methods: {}, status: {}, children: {} };

  for (const [route, methods] of Object.entries(swagger.paths)) {
    const parts = route.split("/").filter(Boolean); // ["api","v1","club","{clubId}"]
    let current = root;
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { name: part, methods: {}, status: {}, children: {} };
      }
      current = current.children[part];
    }

    for (const [verb, op] of Object.entries(methods)) {
      current.methods[verb.toUpperCase()] = extractParams(op);
      current.status = { ...current.status, ...extractResponses(op) };
    }
  }

  return root;
}

/**
 * Extracts query/path params for methods
 */
function extractParams(op: any) {
  const params: any = { pathParams: [], queryParams: [] };
  (op.parameters || []).forEach((p: any) => {
    if (p.in === "path") params.pathParams.push(p.name);
    if (p.in === "query") params.queryParams.push(p.name);
  });
  return params;
}

/**
 * Extracts status codes and DTO references
 */
function extractResponses(op: any) {
  const res: Record<string, string> = {};
  for (const [status, r] of Object.entries(op.responses || {})) {
    const ref = (r as any).content?.["application/json"]?.schema?.["$ref"];
    if (ref) {
      res[status] = ref.split("/").pop()!;
    } else {
      res[status] = "any";
    }
  }
  return res;
}

/**
 * Generate DTO classes
 */
function generateDto(name: string, schema: any): string {
  const props = Object.entries(schema.properties || {})
    .map(([prop, def]: any) => `  ${prop}!: ${mapType(def)};`)
    .join("\n");

  return `import { AbstractDto } from "../AbstractDto";

export class ${name} extends AbstractDto {
${props}
}
`;
}

function mapType(def: any): string {
  switch (def.type) {
    case "string": return "string";
    case "integer":
    case "number": return "number";
    case "boolean": return "boolean";
    case "array": return `${mapType(def.items)}[]`;
    case "object": return "Record<string, any>";
    default: return "any";
  }
}

/**
 * Generate node class recursively
 */
function generateNode(node: Node, parentPath: string[], outDir: string) {
  const className = toClassName(node.name) + "Node";
  const filePath = path.join(outDir, `${className}.ts`);

  const childrenDecl = Object.entries(node.children)
    .map(([childKey, child]) => {
      const childClass = toClassName(child.name) + "Node";
      return `  ${sanitizeName(childKey)} = new ${childClass}(this);`;
    })
    .join("\n");

  const methodsDecl = Object.entries(node.methods)
    .map(([verb, params]) => {
      return `      [RestMethod.${verb}]: ${JSON.stringify(params)}`;
    })
    .join(",\n");

  const statusDecl = Object.entries(node.status)
    .map(([status, dto]) => `      ${status}: ${dto}`)
    .join(",\n");

  const code = `import { AbstractApiNode, AbstractMethodObject, AbstractStatusObject } from "../../src/AbstractApiNode";
import { RestMethod } from "../../src/enums/RestMethod";

${Object.keys(node.status)
  .map((s) => node.status[s])
  .filter((dto) => dto !== "any")
  .map((dto) => `import { ${dto} } from "../../dtos/${dto}";`)
  .join("\n")}

export class ${className} extends AbstractApiNode {
${childrenDecl}

  constructor(parent?: AbstractApiNode) {
    const methods: AbstractMethodObject = {
${methodsDecl}
    };
    const status: AbstractStatusObject = {
${statusDecl}
    };
    super("${node.name}", methods, status);
    if (parent) this.setParent(parent);
  }
}
`;

  fs.writeFileSync(filePath, code);

  // recurse for children
  for (const child of Object.values(node.children)) {
    generateNode(child, [...parentPath, node.name], outDir);
  }
}

/**
 * Helpers
 */
function toClassName(segment: string): string {
  if (segment.startsWith("{") && segment.endsWith("}")) {
    return "By" + segment.slice(1, -1).replace(/^\w/, (c) => c.toUpperCase());
  }
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, "");
}

function sanitizeName(name: string): string {
  if (name.startsWith("{")) return "by" + name.slice(1, -1).replace(/^\w/, (c) => c.toUpperCase());
  return name;
}

/**
 * Entry point
 */
export function runParser(swaggerPath: string, outputDir: string) {
  const swagger: Swagger = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
  fs.rmdirSync(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, "dtos"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "nodes"), { recursive: true });

  // generate DTOs
  for (const [name, schema] of Object.entries(swagger.components?.schemas || {})) {
    fs.writeFileSync(path.join(outputDir, "dtos", `${name}.ts`), generateDto(name, schema));
  }

  // build tree
  const tree = buildTree(swagger);

  // generate nodes
  generateNode(tree, [], path.join(outputDir, "nodes"));
}
