import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  page.on('pageerror', err => {
    errors.push({
      message: err.message,
      stack: err.stack
    });
  });
  
  try {
    console.log('Opening http://localhost:5177/...');
    await page.goto('http://localhost:5177/', { waitUntil: 'networkidle', timeout: 10000 });
    
    console.log('\n=== Page loaded successfully ===\n');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'chatpanel-zero-initial.png', fullPage: true });
    console.log('Screenshot saved to chatpanel-zero-initial.png\n');
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}\n`);
    
    // Check if root div has content
    const rootContent = await page.$eval('#root', el => el.innerHTML);
    console.log(`Root element content length: ${rootContent.length} characters\n`);
    
    if (rootContent.trim().length === 0) {
      console.log('⚠️  Root element is empty!\n');
    }
    
    // Print console messages
    if (consoleMessages.length > 0) {
      console.log('=== Console Messages ===');
      consoleMessages.forEach(msg => {
        console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
        if (msg.location.url) {
          console.log(`  at ${msg.location.url}:${msg.location.lineNumber}:${msg.location.columnNumber}`);
        }
      });
      console.log('');
    } else {
      console.log('No console messages captured.\n');
    }
    
    // Print errors
    if (errors.length > 0) {
      console.log('=== JavaScript Errors ===');
      errors.forEach(err => {
        console.log(`ERROR: ${err.message}`);
        console.log(err.stack);
      });
      console.log('');
    } else {
      console.log('✓ No JavaScript errors found.\n');
    }
    
  } catch (err) {
    console.error('Failed to load page:', err.message);
  } finally {
    await browser.close();
  }
})();
