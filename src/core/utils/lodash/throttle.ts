/**
 * source by `lodash`
 * https://github.com/lodash/lodash.git
 */
/* istanbul ignore next */
import { isObject } from '../index';
import debounce from './debounce';

function throttle(
  func: (...args: any[]) => any,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean; maxWait?: number },
) {
  let leading = true;
  let trailing = true;

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  });
}

export default throttle;
