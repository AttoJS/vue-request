import fetchMock from 'fetch-mock';

import generateService from '../core/utils/generateService';

describe('generateService', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
  });

  const successApi = 'http://example.com/200';
  const failApi = 'http://example.com/404';
  // mock fetch
  const resultData = { data: 'success' };
  fetchMock.get(successApi, resultData);
  fetchMock.get(failApi, 404);

  const unknownService = 1;
  const serviceWillReturnString = () => successApi;
  const serviceWillReturnObject = () => ({ url: successApi });
  const serviceWillReturnUnknown = () => unknownService;

  const originalError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  test('should use string service', async () => {
    const service = generateService<{ data: string }, any>(successApi);
    expect(await service()).toMatchObject(resultData);
  });

  test('should throw error when service error', async () => {
    const fn = jest.fn();
    const service = generateService(failApi);
    try {
      await service();
    } catch (error) {
      expect(error.message).toBe('Not Found');
      fn();
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should use object service', async () => {
    const service = generateService({
      test: 'value',
      url: successApi,
    });
    expect(await service()).toMatchObject(resultData);
  });

  test('should use function service that will return string', async () => {
    const service = generateService(serviceWillReturnString);
    expect(await service()).toMatchObject(resultData);
  });

  test('should use function service that will return object', async () => {
    const service = generateService(serviceWillReturnObject);
    expect(await service()).toMatchObject(resultData);
  });

  test('should use function service that will return unknown type', async () => {
    const fn = jest.fn();
    const service = generateService(serviceWillReturnUnknown as any);
    try {
      await service();
    } catch (error) {
      expect(error.message).toBe('Warning: [vue-request] Unknown service type');
      fn();
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should throw error when use unknown service', async () => {
    const fn = jest.fn();
    try {
      const service = generateService(unknownService as any);
      await service();
    } catch (error) {
      expect(error.message).toBe('Warning: [vue-request] Unknown service type');
      fn();
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
