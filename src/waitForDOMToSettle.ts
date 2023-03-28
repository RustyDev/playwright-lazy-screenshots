import { Page } from 'playwright';

export async function waitForDOMToSettle(page: Page, timeoutMs = 10000, debounceMs = 1000) {
  await page.evaluate(
    ({ timeoutMs, debounceMs }) => {
      const debounce = (func, ms = 1000) => {
        let timeout: string | number | NodeJS.Timeout;
        return (...args) => {
          console.log('in debounce, clearing timeout again');
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            func.apply(this, args);
          }, ms);
        };
      };
      return new Promise<void>((resolve, reject) => {
        const mainTimeout = setTimeout(() => {
          observer.disconnect();
          reject(new Error('Timed out whilst waiting for DOM to settle'));
        }, timeoutMs);

        const debouncedResolve = debounce(async () => {
          observer.disconnect();
          clearTimeout(mainTimeout);
          resolve();
        }, debounceMs);

        const observer = new MutationObserver(() => {
          debouncedResolve();
        });
        const config = {
          attributes: true,
          childList: true,
          subtree: true,
        };
        observer.observe(document.body, config);
      });
    },
    { timeoutMs, debounceMs },
  );
}
