import merge from '../core/utils/lodash/merge';

describe('utils', () => {
  beforeAll(() => {});

  beforeEach(() => {});

  test('no other object are passed', () => {
    const obj1 = {
      a: [{ b: { c: 1 } }],
    };

    expect(merge(obj1)).toStrictEqual(obj1);
  });

  test('merge should work: case 1', () => {
    const obj1 = {
      a: [{ b: { c: 1 } }],
    };
    const obj2 = {
      a: [{ b: { d: 2 } }],
    };
    expect(merge(obj1, obj2)).toStrictEqual({ a: [{ b: { c: 1, d: 2 } }] });
  });

  test('merge should work: case 2', () => {
    const obj1 = {
      a: [{ b: { c: 1 } }],
    };
    const obj2 = {
      a: [{ b: { d: undefined } }],
    };
    expect(merge(obj1, obj2)).toStrictEqual({ a: [{ b: { c: 1 } }] });
  });

  test('merge should work: case 3', () => {
    const obj1 = {
      a: [{ b: { c: 1 } }],
    };
    const obj2 = {
      a: [{ b: { c: undefined } }],
    };
    expect(merge(obj1, obj2)).toStrictEqual({ a: [{ b: { c: 1 } }] });
  });

  test('merge should work: case 4', () => {
    const obj1 = {
      a: [{ b: { c: 1 } }],
    };
    const obj2 = {
      a: { b: { c: undefined } },
    };
    expect(JSON.stringify(merge(obj1, obj2))).toBe(`{"a":[{"b":{"c":1}}]}`);
  });

  test('merge should work: case 5', () => {
    const obj1 = {
      a: { b: { c: 1 } },
    };
    const obj2 = {
      a: { b: { c: undefined, d: 2 } },
    };
    expect(merge(obj1, obj2)).toStrictEqual({ a: { b: { c: 1, d: 2 } } });
  });

  test('merge should work: case 6', () => {
    const obj1 = {
      a: { b: { c: 1 } },
    };
    const obj2 = {
      a: 1,
    };
    expect(merge(obj1, obj2)).toStrictEqual({ a: 1 });
  });

  test('merge should work: case 7', () => {
    const obj1 = {
      a: { b: { c: 1 } },
    };
    const obj2 = {
      a: {
        b: {
          c: () => {
            console.log(123);
          },
        },
      },
    };
    expect(merge(obj1, obj2)).toStrictEqual(obj2);
  });

  test('merge should work: case 8', () => {
    const obj1 = {
      a: [{ b: { b1: 123 } }],
    };
    const obj2 = {
      a: [{ b: [1, 2] }],
    };

    expect(merge(obj1, obj2)).toStrictEqual({
      a: [{ b: { 0: 1, 1: 2, b1: 123 } }],
    });
  });

  test('merge should work: case 9', () => {
    const object = {
      a: [{ g: 3 }, { f: 5 }],
      b: 123,
    };

    const other = {
      b: null,
    };

    expect(merge(object, other)).toStrictEqual({
      a: [{ g: 3 }, { f: 5 }],
      b: null,
    });
  });

  test('merge should work: case 10', () => {
    const object = {
      a: [{ g: 3 }, { f: 5 }],
      b: 123,
    };

    const other = {
      b: undefined,
    };

    expect(merge(object, other)).toStrictEqual({
      a: [{ g: 3 }, { f: 5 }],
      b: 123,
    });
  });

  test('multi object merge should work', () => {
    const object = {
      a: [{ b: 2 }, { d: 4 }],
    };

    const other1 = {
      a: [{ c: 3 }, { e: 5 }],
    };

    const other2 = {
      a: [{ g: 3 }, { f: 5 }],
      b: 123,
    };

    const other3 = {
      b: {
        my: 'name',
      },
    };

    expect(merge(object, other1, other2, other3)).toStrictEqual({
      a: [
        { b: 2, c: 3, g: 3 },
        { d: 4, e: 5, f: 5 },
      ],
      b: { my: 'name' },
    });
  });
});
