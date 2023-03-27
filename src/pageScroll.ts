/*
Credit to https://github.com/mbalabash/puppeteer-autoscroll-down
Refactored to work with Playwright
*/

function scrollPage(scrollDirection) {
  return async (page, { size = 250, delay = 100, stepsLimit = null } = {}) => {
    const lastScrollPosition = await page.evaluate(
      async (params) => {
        const { size, delay, stepsLimit, scrollDirection } = params;
        const getElementScrollHeight = (element) => {
          if (!element) return 0;
          const { scrollHeight, offsetHeight, clientHeight } = element;
          return Math.max(scrollHeight, offsetHeight, clientHeight);
        };

        const initialScrollPosition = window.pageYOffset;
        const availableScrollHeight = getElementScrollHeight(document.body);
        let lastPosition = scrollDirection === 'bottom' ? 0 : initialScrollPosition;

        const scrollFn = (resolve) => {
          const intervalId = setInterval(() => {
            window.scrollBy(0, scrollDirection === 'bottom' ? size : -size);
            lastPosition += scrollDirection === 'bottom' ? size : -size;

            if (
              (scrollDirection === 'bottom' && lastPosition >= availableScrollHeight) ||
              (scrollDirection === 'bottom' && stepsLimit !== null && lastPosition >= size * stepsLimit) ||
              (scrollDirection === 'top' && lastPosition <= 0) ||
              (scrollDirection === 'top' &&
                stepsLimit !== null &&
                lastPosition <= initialScrollPosition - size * stepsLimit)
            ) {
              clearInterval(intervalId);
              resolve(lastPosition);
            }
          }, delay);
        };

        return new Promise(scrollFn);
      },
      { size, delay, stepsLimit, scrollDirection },
    );

    return lastScrollPosition;
  };
}

const scrollPageToBottom = scrollPage('bottom');
const scrollPageToTop = scrollPage('top');

export { scrollPageToBottom, scrollPageToTop };
