const limitTrigger = (fn: any, timeInterval: number) => {
  let running = false;
  return (...args: any[]) => {
    if (running) return;

    running = true;
    fn(...args);
    setTimeout(() => {
      running = false;
    }, timeInterval);
  };
};

export default limitTrigger;
