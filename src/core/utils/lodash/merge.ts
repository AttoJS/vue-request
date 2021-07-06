import { isArray, isObject, isPlainObject } from '../index';

type MergeObject = Record<string, any>;

function baseMerge(origin: MergeObject, target: MergeObject) {
  for (const key in target) {
    if (target[key] === undefined) {
      continue;
    }

    if (
      !isObject(target[key]) || // `target[key]` is not an object
      !isObject(origin[key]) || // `target[key]` is not an object
      !(key in origin) // `key` is not in the origin object
    ) {
      origin[key] = target[key];
      continue;
    }

    if (isPlainObject(target[key]) || isArray(target[key])) {
      baseMerge(origin[key], target[key]);
    }
  }
}

function merge(origin: MergeObject, ...others: MergeObject[]): any {
  const result = Object.assign({}, origin);
  if (!others.length) return result;

  for (const item of others) {
    baseMerge(result, item);
  }

  return result;
}

export default merge;
