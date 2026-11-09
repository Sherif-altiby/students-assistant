import type { Browser, LaunchOptions } from 'puppeteer-core' with {
  'resolution-mode': 'import',
};

const localLaunchOptions: LaunchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ],
};

export async function launchPdfBrowser(): Promise<Browser> {
  if (process.env.VERCEL === '1') {
    const [puppeteer, chromiumModule] = await Promise.all([
      import('puppeteer-core'),
      import('@sparticuz/chromium'),
    ]);
    const chromium = chromiumModule.default;
    const args = await puppeteer.default.defaultArgs({
      args: chromium.args,
      headless: 'shell',
    });

    return puppeteer.default.launch({
      args,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }

  const puppeteer = await import('puppeteer');
  return puppeteer.default.launch(localLaunchOptions);
}
