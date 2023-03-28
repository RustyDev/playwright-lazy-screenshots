# Playwright Bulk Screenshots w/ Lazy Loading

A bulk screenshot tool that automates the capture of one or multiple URLs and saves them to a specified directory. It can take full-page screenshots or screenshots of a single viewport, accounts for lazy loaded images and content.

## Installation

To install the dependencies, run the following command in the terminal:

```bash
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
yarn start [options]
```

where `[options]` are the command line options you can pass to the script:

## Options

| Command       | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| --urls, -u    | List of urls: google.com yahoo.com (overrides urls.txt)     |
| --output, -o  | Output directory (default: screenshots)                     |
| --single, -s  | Screenshot only the first viewport                          |
| --width, -x   | Viewport width in pixels (default: 1400)                    |
| --height, -y  | Viewport height in pixels (default: 800)                    |
| --delay, -d   | Delay between scroll events (default: 375)                  |
| --mobile, -m  | Mobile emulation mode                                       |
| --headed, -h  | Run headed (opens Chromium while running)                   |
| --ext, -e     | File extension to use (default: png) - png, jpg, jpeg, webp |
| --quality, -q | Quality of screenshot image: 1-100 (png is always 100)      |
| --help        | Print this usage guide                                      |

### Examples:

```bash
yarn start --help
yarn start -m -u slack.com -o screens -e jpg -q 80 -x 1024 -y 768 -d 100
yarn start --mobile --urls slack.com --output screens --ext jpg --quality 80 --width 1024 --height 768 --delay 100
yarn start -msu slack.com
```

```bash
yarn start -u nytimes.com -o screens
```

### Run Tests

```bash
npx playwright test
# or
npx playwright test --ui
```

### Screenshot Example:

![nytimes_com](https://user-images.githubusercontent.com/490988/227745739-626f2413-3315-4c06-a1b5-8c2779c8347f.jpg)
