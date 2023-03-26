import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import * as progress from 'cli-progress';
import { Browser, chromium, devices, Locator, Page } from 'playwright';
import { scrollPageToBottom, scrollPageToTop } from './pageScroll';

interface Args {
  d?: number;
  e?: AllowedExtensions;
  u?: string;
  h?: boolean;
  m?: boolean;
  o?: string;
  q?: number;
  s?: boolean;
  vh?: number;
  vw?: number;
}

type AllowedExtensions = 'png' | 'jpg' | 'jpeg' | 'webp';

const args: Args = minimist(process.argv.slice(2), {
  alias: {
    d: 'delay',
    e: 'extension',
    u: 'urls',
    h: 'headless',
    m: 'mobile',
    o: 'output',
    q: 'quality',
    s: 'disableScrolling',
    vh: 'viewportHeight',
    vw: 'viewportWidth',
  },
  string: ['urls', 'output', 'extension'],
  boolean: ['headless', 'disableScrolling', 'mobile'],
  number: ['delay', 'quality', 'viewportHeight', 'viewportWidth'],
});

const width: number = args.vw ?? 1400;
const height: number = args.vh ?? 800;
const mobile: boolean = args.m ? true : false;
const headless: boolean = args.h ? false : true;
const viewport = [width, height];
const disableScrolling: boolean = args.s ?? false;
const dir: string = args.o ?? 'screenshots';
const delay: number = args.d ?? 375;
const extension: AllowedExtensions = args.e ?? 'png';
const quality: number = args.q;
const cliUrls: string[] = args.u?.split(',') ?? [];

const urls: string[] = cliUrls.length
  ? cliUrls.map((u) => u)
  : fs
      .readFileSync('urls.txt', { encoding: 'utf-8' })
      .split('\n')
      .filter((url: string) => url.trim() !== '');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

const totalScreenshots = urls.length;

const progressBar = new progress.SingleBar(
  {
    format: '{bar} {percentage}% | {value}/{total} | {url}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: false,
  },
  progress.Presets.shades_classic,
);

type WaitForRes = [locatorIndex: number, locator: Locator];

export async function waitForOneOf(locators: Locator[]): Promise<WaitForRes> {
  const res = await Promise.race([
    ...locators.map(async (locator, index): Promise<WaitForRes> => {
      let timedOut = false;
      await locator.waitFor({ state: 'visible' }).catch(() => (timedOut = true));
      return [timedOut ? -1 : index, locator];
    }),
  ]);
  if (res[0] === -1) {
    throw new Error('no locator visible before timeout');
  }
  return res;
}

export async function takeScreenshot(
  page: Page,
  url: string,
  dir: string,
  disableScrolling: boolean,
  viewport: number[],
  delay: number,
  extension: AllowedExtensions,
) {
  // await setViewportSize(page, viewport);
  await navigateToUrl(page, url);
  await pressEscapeKey(page);
  await scrollPage(page, viewport, delay, disableScrolling);
  await saveScreenshot(page, dir, url, extension, !disableScrolling, quality);
}

export async function setViewportSize(page: Page, viewport: number[]) {
  await page.setViewportSize({
    width: viewport[0],
    height: viewport[1],
  });
}

export async function navigateToUrl(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
}

export async function pressEscapeKey(page: Page) {
  await page.waitForTimeout(2000);
  await page.keyboard.down('Escape');
}

export async function scrollPage(page: Page, viewport: number[], delay: number, disableScrolling: boolean) {
  if (!disableScrolling) {
    await scrollPageToBottom(page, {
      size: viewport[1],
      delay,
    });
    // scroll to top to capture fixed navs
    await page.waitForTimeout(250);
    await scrollPageToTop(page, {
      size: viewport[1],
      delay,
    });
    await page.waitForTimeout(500);
  }
}

export async function saveScreenshot(
  page: Page,
  dir: string,
  url: string,
  extension: AllowedExtensions,
  fullPage: boolean,
  quality: number = null,
) {
  const domain: string = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '_');
  const screenshotPath: string = path.join(dir, `${domain}.${extension}`);

  await page.screenshot({
    path: screenshotPath,
    fullPage,
    ...(quality ? { quality } : {}),
  });
}

(async () => {
  // if (process.env.NODE_ENV === 'TEST') return;

  const browser: Browser = await chromium.launch({
    headless,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=en-US,en;q=0.9'],
  });

  const context = await browser.newContext({
    ...(mobile ? devices['iPhone 12'] : {}),
  });

  try {
    progressBar.start(totalScreenshots, 0);

    for (let i = 0; i < totalScreenshots; i++) {
      const url = urls[i];

      const page = context ? await context.newPage() : await browser.newPage();

      let urlWithProtocol = url;

      if (!urlWithProtocol.match(/^[a-zA-Z]+:\/\//)) {
        urlWithProtocol = `https://${urlWithProtocol}`;
      }

      progressBar.update(i + 1, { url });
      await takeScreenshot(page, urlWithProtocol, dir, disableScrolling, viewport, delay, extension);

      await page.close();
    }
    progressBar.stop();
    console.log(`Done! Saved ${totalScreenshots} screenshots to ${dir}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
