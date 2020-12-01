export const request = (...args: any[]) =>
  new Promise<string>(resolve => {
    setTimeout(() => {
      resolve(args.join(',') || 'success');
    }, 1000);
  });

export const failedRequest = () =>
  new Promise<Error>((_, reject) => {
    setTimeout(() => {
      reject(new Error('fail'));
    }, 1000);
  });
