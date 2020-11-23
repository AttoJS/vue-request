import { Ref } from 'vue';

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
