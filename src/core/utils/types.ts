import { Ref } from 'vue';
import { Query } from '../createQuery';

export type PartialRecord<T> = {
  [P in keyof T]: Partial<T[P]>;
};

export type RefObject = {
  [key: string]: Ref<any>;
};

export type UnRef<T> = T extends Ref<infer V> ? V : T;

export type UnWrapRefObject<T> = {
  [P in keyof T]: UnRef<T[P]>;
};

export type ServiceObject = Partial<RequestInit> & {
  [key: string]: any;
  url: string;
};

export type ServiceParams = string | ServiceObject;

export type IService<R, P extends unknown[]> =
  | ((...args: P) => ServiceParams)
  | ServiceParams
  | Query<R, P>;
