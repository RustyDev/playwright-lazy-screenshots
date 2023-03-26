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

- `-vw <width>`: set the viewport width (default: 1400)
- `-vh <height>`: set the viewport width (default: 800)
- `-u <urls>`: urls to screenshot, separated by a comma - google.com,yahoo.com (default: urls.txt)
- `-h <headless>`: set to run headed Chrome (default: false)
- `-s <single>`: disable scrolling to take a full-page screenshot (default: false)
- `-m <mobile>`: take screenshots with iPhone 13 dimensions (default: false)
- `-o <output>`: set the output directory for the screenshots (default: "screenshots")
- `-d <delay>`: set the delay between each scroll event in milliseconds to trigger lazy loaded content (default: 375)
- `-e <extension>`: set the file extension for the screenshots - `jpg` | `png` | `jpeg` (default: "png")
- `-q <quality>`: set the quality for the screenshots (except png) - 1 to 100 (default: 100)

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
