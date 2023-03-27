import * as fs from 'fs';
import commandLineUsage from 'command-line-usage';
import commandLineArgs, { OptionDefinition } from 'command-line-args';
import * as path from 'path';
import * as progress from 'cli-progress';
import { Browser, chromium, devices, Locator, Page } from 'playwright';
import { scrollPageToBottom, scrollPageToTop } from './pageScroll';

interface Args {
  delay?: number;
  depth?: number;
  extension?: AllowedExtensions;
  browser?: boolean;
  help?: boolean;
  height?: number;
  mobile?: boolean;
  output?: string;
  quality?: number;
  single?: boolean;
  urls?: string[];
  width?: number;
}

type AllowedExtensions = 'png' | 'jpg' | 'jpeg' | 'webp';

const optionDefinitions: OptionDefinition[] = [
  { name: 'delay', alias: 'd', type: Number, defaultValue: 250 },
  { name: 'extension', alias: 'e', type: String, defaultValue: 'png' },
  { name: 'browser', alias: 'b', type: Boolean, defaultValue: true },
  { name: 'height', alias: 'h', type: Number, defaultValue: 800 },
  { name: 'help', type: Boolean },
  { name: 'mobile', alias: 'm', type: Boolean, defaultValue: false },
  { name: 'output', alias: 'o', type: String, defaultValue: 'screenshots' },
  { name: 'quality', alias: 'q', type: Number },
  { name: 'single', alias: 's', type: Boolean, defaultValue: false },
  { name: 'urls', alias: 'u', type: String, multiple: true },
  { name: 'width', alias: 'w', type: Number, defaultValue: 1400 },
];

const args: Args = commandLineArgs(optionDefinitions);

console.log(args);

const width: number = args.width ?? 1400;
const height: number = args.height ?? 800;
const mobile: boolean = args.mobile ? true : false;
const headless: boolean = args.browser ? args.browser : true;
const viewport = [width, height];
const disableScrolling: boolean = args.single ?? false;
const output: string = args.output ?? 'screenshots';
const delay: number = args.delay ?? 375;
const extension: AllowedExtensions = args.extension;
const quality: number = args.quality;
const cliUrls: string[] = args.urls ?? [];

const urls: string[] = cliUrls.length
  ? cliUrls.map((u) => u)
  : fs
      .readFileSync('urls.txt', { encoding: 'utf-8' })
      .split('\n')
      .filter((url: string) => url.trim() !== '');

if (!fs.existsSync(output)) {
  fs.mkdirSync(output);
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
  if (!mobile) {
    await setViewportSize(page, viewport);
  }
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
  const { hostname, pathname } = new URL(url);
  const imageName = `${hostname}${pathname}`.replace(/[^a-zA-Z0-9]/g, '_');
  const mobileFlag = mobile ? '_mobile' : '';
  const screenshotPath: string = path.join(dir, `${imageName}${mobileFlag}.${extension}`);

  await page.screenshot({
    path: screenshotPath,
    fullPage,
    ...(quality ? { quality } : {}),
  });
}

(async () => {
  const browser: Browser = await chromium.launch({
    headless,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=en-US,en;q=0.9'],
  });

  const context = await browser.newContext({
    ...(mobile ? devices['iPhone 13'] : {}),
  });

  try {
    progressBar.start(totalScreenshots, 0);

    for (let i = 0; i < totalScreenshots; i++) {
      const currentUrl = urls[i];

      const page = context ? await context.newPage() : await browser.newPage();

      let urlWithProtocol = currentUrl;

      if (!urlWithProtocol.match(/^[a-zA-Z]+:\/\//)) {
        urlWithProtocol = `https://${urlWithProtocol}`;
      }

      progressBar.update(i + 1, { url: currentUrl });

      await takeScreenshot(page, urlWithProtocol, output, disableScrolling, viewport, delay, extension);

      await page.close();
    }
    progressBar.stop();

    console.log(`Done! Saved ${totalScreenshots} screenshots to ${output}`);
  } catch (error) {
    console.error(error);

    process.exit(1);
  } finally {
    await browser.close();
  }
})();

const sections = [
  {
    header: 'Playwright Bulk Screenshots w/ Lazy Loading',
    content:
      'This Node.js application captures screenshots of a list of URLs and saves them to a specified directory. It can take full-page screenshots or screenshots of a single viewport, and uses the `playwright` to automate the process.',
  },
  {
    header: 'Options',
    optionList: [
      {
        name: 'urls, u',
        typeLabel: '{underline file}',
        description: 'List of urls: google.com,yahoo.com (overrides urls.txt)',
      },
      {
        name: 'output, o',
        typeLabel: '{underline directory}',
        description: 'Output directory (default: screenshots)',
      },
      { name: 'single, s', typeLabel: '{underline boolean}', description: 'Screenshot only the first viewport' },

      { name: 'width, w', typeLabel: '{underline number}', description: 'Viewport width in pixels (default: 1400)' },
      { name: 'height, h', typeLabel: '{underline number}', description: 'Viewport height in pixels (default: 800)' },
      { name: 'delay, d', typeLabel: '{underline number}', description: 'Delay between scroll events (default: 375)' },

      { name: 'mobile, m', typeLabel: '{underline boolean}', description: 'Mobile emulation mode' },
      {
        name: 'browser, b',
        typeLabel: '{underline boolean}',
        description: 'Run headed (opens Chromium while running)',
      },

      {
        name: 'extension, e',
        typeLabel: '{underline string}',
        description: 'File extension to use (default: png) - png, jpg, jpeg, webp',
      },
      {
        name: 'quality, q',
        typeLabel: '{underline number}',
        description: 'Quality of screenshot image: 1-100 (png is always 100).',
      },

      {
        name: 'help',
        description: 'Print this usage guide.',
      },
    ],
  },
];
const usage = commandLineUsage(sections);

if (args.help) {
  console.log(usage);
  process.exit(0);
}
