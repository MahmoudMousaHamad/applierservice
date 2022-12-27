import { ElementHandle } from "puppeteer";
import Logger from "../lib/Logger";

export async function scroll() {
	await globalThis.page.evaluate(async () => {
		await new Promise<void>((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 400);
        });
	})
}

export async function checkTabs() {
	let pages = await globalThis.browser.pages();
	Logger.info(`There are ${pages.length} tabs open.`);
	if (pages.length > 1) {
		Logger.info("Closing tab " + await pages[0].title());
		await pages[0].close();
		page = pages[1];
	}
}

export async function getText(xpath: string): Promise<string> {
	const [e] = await page.$x(xpath);
	return await globalThis.page.evaluate(name => name.textContent, e) as string;
}

export async function getElementText(e: ElementHandle<Node>): Promise<string> {
	return await globalThis.page.evaluate(name => name.textContent, e) as string;
}

export async function clearInput(e: ElementHandle | string) {
	if (e instanceof ElementHandle) {
		await e.click({clickCount: 3});
		await e.press('Backspace'); 
	} else if (typeof e === 'string' || e as any instanceof String) {
		await globalThis.page.evaluate(async (selector) => {
			const element = document.querySelector(selector) as HTMLInputElement;
			if (element) element.value = "";
			else Logger.error(`Element with selector ${selector} was not found`);
		}, e);
	}
}

export async function type(e: ElementHandle, text: string) {
	await e.type(text, { delay: 20 });
}

export async function sleep(s: number) {
	await new Promise<void>((resolve) => setTimeout(() => resolve(), s));
}

export async function getElements(s: string, xpath = false): Promise<ElementHandle[]> {
	const elements = xpath ? await globalThis.page.$x(s) : await globalThis.page.$$(s);
	return elements as ElementHandle[];
}

export async function getElement(s: string, xpath = false) {
	return xpath ? (await page.$x(s))[0] : await page.$(s);
}

export async function getElementsBy(by: { selector: string, xpath: boolean }) {
	return await getElements(by.selector, by.xpath);
}

export async function getElementBy(by: {selector: string, xpath: boolean}) {
	return await getElement(by.selector, by.xpath);
}
