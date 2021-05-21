import { isPlainObject, isPlainArray, isObject, isSameType } from '../index';

const mergeArr = (oriArr: any[], target: any[]) => {
  for (let i = 0; i < target.length; i++) {
    if (
      !isObject(target[i]) ||
      !isSameType(oriArr[i], target[i]) ||
      (!oriArr[i] && target[i])
    ) {
      if (isObject(oriArr[i]) && isObject(target[i])) return;
      oriArr[i] = target[i];
    }
    isPlainObject(target[i]) && mergeObj(oriArr[i], target[i]);
    isPlainArray(target[i]) && mergeArr(oriArr[i], target[i]);
  }
};

const mergeObj = (oriObj: object, target: object) => {
  for (const key in target) {
    if (
      !isObject(target[key]) ||
      !isSameType(oriObj[key], target[key]) ||
      !(key in oriObj)
    ) {
      if (isObject(oriObj[key]) && isObject(target[key])) return;
      oriObj[key] = target[key];
    }
    isPlainObject(target[key]) && mergeObj(oriObj[key], target[key]);
    isPlainArray(target[key]) && mergeArr(oriObj[key], target[key]);
  }
};

function merge(origin: object, ...other: object[]) {
  const result = Object.assign({}, origin);
  if (!other.length) return result;

  for (let i = 0; i < other.length; i++) {
    mergeObj(result, other[i]);
  }

  return result;
}

export default merge;
