import { ElementHandle } from "puppeteer";
import Logger from "../lib/Logger";

export class Helper {
	private static instances: { [userId: string]: Helper} = {};

	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	public static getInstance(userId: string): Helper {
		if (!Helper.instances[userId]) {
			Helper.instances[userId] = new Helper(userId);
			return Helper.instances[userId];
		}
		return Helper.instances[userId];
	}

	async scroll() {
		await pages[this.userId].evaluate(async () => {
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

	async checkTabs() {
		const p = await browsers[this.userId].pages();
		Logger.info(`There are ${p.length} tabs open.`);
		if (p.length > 1) {
			Logger.info("Closing tab " + await p[0].title());
			await p[0].close();
			pages[this.userId] = p[1];
		}
	}

	async getText(xpath: string): Promise<string> {
		const [e] = await pages[this.userId].$x(xpath);
		return await pages[this.userId].evaluate(name => name.textContent, e) as string;
	}

	async getElementText(e: ElementHandle<Node>): Promise<string> {
		return await pages[this.userId].evaluate(name => name.textContent, e) as string;
	}

	async clearInput(e: ElementHandle | string) {
		if (e instanceof ElementHandle) {
			await e.click({clickCount: 3});
			await e.press('Backspace'); 
		} else if (typeof e === 'string' || e as any instanceof String) {
			await pages[this.userId].evaluate(async (selector) => {
				const element = document.querySelector(selector) as HTMLInputElement;
				if (element) element.value = "";
				else Logger.error(`Element with selector ${selector} was not found`);
			}, e);
		}
	}

	async type(e: ElementHandle, text: string) {
		await e.type(text, { delay: 20 });
	}

	async sleep(s: number) {
		await new Promise<void>((resolve) => setTimeout(() => resolve(), s));
	}

	async getElements(s: string, xpath = false): Promise<ElementHandle[]> {
		const elements = xpath ? await pages[this.userId].$x(s) : await pages[this.userId].$$(s);
		return elements as ElementHandle[];
	}

	async getElement(s: string, xpath = false) {
		return xpath ? (await pages[this.userId].$x(s))[0] : await pages[this.userId].$(s);
	}

	async getElementsBy(by: { selector: string, xpath: boolean }) {
		return await this.getElements(by.selector, by.xpath);
	}

	async getElementBy(by: {selector: string, xpath: boolean}) {
		return await this.getElement(by.selector, by.xpath);
	}

}
