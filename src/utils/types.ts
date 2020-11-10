export type PartialRecord<T> = {
  [P in keyof T]: Partial<T[P]>;
};
