import { RestMethod } from './enums/RestMethod.ts';
import { RestStatus } from './enums/RestStatus.ts';
import { RequestParamsInterface } from './UrlBuilder.ts';

export type AbstractMethodObject = {
  [method in RestMethod]?: RequestParamsInterface;
};

export type AbstractStatusObject = {};

export abstract class AbstractApiNode {
  name: string;
  parent: AbstractApiNode | null = null;

  methods: AbstractMethodObject;

  status: AbstractStatusObject;

  tested: boolean = false;

  constructor(name: string, methods: AbstractMethodObject, status: AbstractStatusObject) {
    this.name = name;
    this.methods = methods;
    this.status = status;
  }

  setParent(parent: AbstractApiNode) {
    this.parent = parent;
  }

  test() {
    this.tested = true;
  }

  getPath(): string[] {
    return this.parent ? [...this.parent.getPath(), this.name] : [this.name];
  }
}
