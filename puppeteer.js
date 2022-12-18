const puppeteer = require('puppeteer-extra');
const {executablePath} = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const stealthPlugin = StealthPlugin();
// https://github.com/berstend/puppeteer-extra/issues/668
stealthPlugin.enabledEvasions.delete('iframe.contentWindow');
stealthPlugin.enabledEvasions.delete('navigator.plugins');
puppeteer.use(stealthPlugin);

// const getByXpath = async (xpath) => {
//     const [e] = await page.$x("//a[text()='Sign in']")[0];
//     if (e) return e;
//     throw Error("Element was not found");
// } 

(async () => {
    const browser = await puppeteer.launch({
        executablePath: executablePath(),
        // headless: false,
    });
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.goto('https://google.com');
    //   await page.evaluate(() => {
    //     document.getElementsByClassName("gb_7")[0].click();
    //   });
    const [button] = await page.$x("//a[contains(text(),'Sign in')]");
    await button.click();
    await page.waitForTimeout(1000);
    await page.type("input[type='email']", "mahmoudmousahamad\n", {delay: 20});
    await page.waitForTimeout(1000);
    await page.type("input[type='password']", "5337301Mh!\n", {delay: 20});  
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test.png' });
    await browser.close();
})();
