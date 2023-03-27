# Playwright Bulk Screenshots w/ Lazy Loading

This Node.js application captures screenshots of a list of URLs and saves them to a specified directory. It can take full-page screenshots or screenshots of a single viewport, and uses the `playwright` to automate the process.

## Installation

To install the dependencies, run the following command in the terminal:

```bash
npm install
# or
yarn
```

## Usage

To use the script, edit `urls.txt` by adding the URLs you want to take screenshots of, one URL per line. If you leave off the protocol, `https://` will be added.

```bash
https://www.nytimes.com
google.com
```

Then run the following command in the terminal:

```bash
npm run start [options]
# or
yarn start [options]
```

where `[options]` are the command line options you can pass to the script:

Options

```
--urls, u file List of urls: google.com,yahoo.com (overrides urls.txt)
--output, o directory Output directory (default: screenshots)
--single, s boolean Screenshot only the first viewport
--width, w number Viewport width in pixels (default: 1400)
--height, h number Viewport height in pixels (default: 800)
--delay, d number Delay between scroll events (default: 375)
--mobile, m boolean Mobile emulation mode
--browser, b boolean Run headed (opens Chromium while running)
--extension, e string File extension to use (default: png) - png, jpg, jpeg, webp
--quality, q number Quality of screenshot image: 1-100 (png is always 100).
--help string Print this usage guide.
```

For example:

```bash
npm run start -m -u stripe.com -o screens -e jpg -q 80
# or
yarn start -m -u stripe.com -o screens -e jpg -q 80
```

```bash
npm run start -u nytimes.com -o screens
# or
yarn start -u nytimes.com -o screens
```

![nytimes_com](https://user-images.githubusercontent.com/490988/227745739-626f2413-3315-4c06-a1b5-8c2779c8347f.jpg)
