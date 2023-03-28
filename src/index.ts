import * as fs from 'fs';
import commandLineArgs, { OptionDefinition } from 'command-line-args';
import * as path from 'path';
import * as progress from 'cli-progress';
import { Browser, chromium, devices, Page } from 'playwright';
import { scrollPageToBottom, scrollPageToTop } from './pageScroll';
import { printHelp } from './help';

interface Args {
  delay?: number;
  depth?: number;
  ext?: AllowedExtensions;
  headed?: boolean;
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
  { name: 'delay', alias: 'd', type: Number, defaultValue: 300 },
  { name: 'headed', alias: 'h', type: Boolean, defaultValue: false },
  { name: 'ext', alias: 'e', type: String, defaultValue: 'png' },
  { name: 'height', alias: 'y', type: Number, defaultValue: 800 },
  { name: 'help', type: Boolean },
  { name: 'mobile', alias: 'm', type: Boolean, defaultValue: false },
  { name: 'output', alias: 'o', type: String, defaultValue: 'screenshots' },
  { name: 'quality', alias: 'q', type: Number },
  { name: 'single', alias: 's', type: Boolean, defaultValue: false },
  { name: 'urls', alias: 'u', type: String, multiple: true, defaultValue: [] },
  { name: 'width', alias: 'x', type: Number, defaultValue: 1400 },
];

const args: Args = commandLineArgs(optionDefinitions);

if (args.help) {
  printHelp();
  process.exit(0);
}

const width: number = args.width;
const height: number = args.height;
const mobile: boolean = args.mobile;
const headed: boolean = args.headed ? false : true;
const viewport = [width, height];
const single: boolean = args.single;
const output: string = args.output;
const delay: number = args.delay;
const ext: AllowedExtensions = args.ext;
const quality: number = args.quality;
const cliUrls: string[] = args.urls;

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
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    format: '{bar} {percentage}% | {value}/{total} | {url}',
    hideCursor: false,
  },
  progress.Presets.shades_classic,
);
export async function takeScreenshot(
  page: Page,
  url: string,
  dir: string,
  single: boolean,
  viewport: number[],
  delay: number,
  ext: AllowedExtensions,
) {
  if (!mobile) {
    await setViewportSize(page, viewport);
  }
  await navigateToUrl(page, url);
  await pressEscapeKey(page);
  await scrollPage(page, viewport, delay, single);
  await saveScreenshot(page, dir, url, ext, !single, quality);
}

export async function setViewportSize(page: Page, viewport: number[]) {
  await page.setViewportSize({
    width: viewport[0],
    height: viewport[1],
  });
}

export async function navigateToUrl(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('load');
}

export async function pressEscapeKey(page: Page) {
  await page.waitForTimeout(1000);
  await page.keyboard.down('Escape');
}

export async function scrollPage(page: Page, viewport: number[], delay: number, single: boolean) {
  if (!single) {
    await scrollPageToBottom(page, {
      size: viewport[1],
      delay,
    });
    await page.waitForTimeout(50);
    // scroll to top to capture fixed navs
    await scrollPageToTop(page, {
      size: viewport[1],
      delay: 50,
    });
    await page.waitForTimeout(500);
  }
}

export async function saveScreenshot(
  page: Page,
  dir: string,
  url: string,
  ext: AllowedExtensions,
  fullPage: boolean,
  quality: number = null,
) {
  const { hostname, pathname } = new URL(url);
  const imageName = `${hostname}${pathname}`.replace(/[^a-zA-Z0-9]/g, '_');
  const sizeFlag = mobile ? '_mobile' : '_desktop';
  const screenshotPath: string = path.join(dir, `${imageName}${sizeFlag}.${ext}`);

  await page.screenshot({
    path: screenshotPath,
    animations: 'disabled',
    fullPage,
    ...(quality ? { quality } : {}),
  });
}

const buildValidFilename = (url: string) => {
  let urlWithProtocol = url;
  if (!urlWithProtocol.match(/^[a-zA-Z]+:\/\//)) {
    urlWithProtocol = `https://${urlWithProtocol}`;
  }
  return urlWithProtocol;
};

(async () => {
  const browser: Browser = await chromium.launch({
    headless: headed,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--lang=en-US,en;q=0.9'],
  });

  try {
    const context = await browser.newContext({
      ...(mobile ? devices['iPhone 13'] : {}),
    });
    progressBar.start(totalScreenshots, 0);

    for (let i = 0; i < totalScreenshots; i++) {
      const currentUrl = urls[i];
      const page = context ? await context.newPage() : await browser.newPage();
      const urlWithProtocol = buildValidFilename(currentUrl);
      progressBar.update(i + 1, { url: currentUrl });
      await takeScreenshot(page, urlWithProtocol, output, single, viewport, delay, ext);
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
