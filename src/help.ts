import commandLineUsage from 'command-line-usage';

const sections = [
  {
    header: 'Playwright Bulk Screenshots w/ Lazy Loading',
    content:
      'A bulk screenshot tool that automates the capture of one or multiple URLs and saves them to a specified directory. It can take full-page screenshots or screenshots of a single viewport, accounts for lazy loaded images and content.',
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

      { name: 'width, x', typeLabel: '{underline number}', description: 'Viewport width in pixels (default: 1400)' },
      { name: 'height, y', typeLabel: '{underline number}', description: 'Viewport height in pixels (default: 800)' },
      { name: 'delay, d', typeLabel: '{underline number}', description: 'Delay between scroll events (default: 100)' },

      { name: 'mobile, m', typeLabel: '{underline boolean}', description: 'Mobile emulation mode' },
      {
        name: 'headed, h',
        typeLabel: '{underline boolean}',
        description: 'Headed mode opens Chromium (default: false)',
      },

      {
        name: 'ext, e',
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

export function printHelp() {
  console.log(commandLineUsage(sections));
}
