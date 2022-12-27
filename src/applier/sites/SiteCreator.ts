import { QuestionInfo, QuestionsInfo } from "../jobapplication/Question";
import { killDriverProcess, Locator, Helper } from "../driver";
import { launchBrowser } from "../driver/Manager";
import { Site, Status } from "./Site";
import { Logger } from "../lib";

export default abstract class SiteCreator {
	questionsInfo: QuestionsInfo = {
		text: new QuestionInfo(
			"text",
			["input[type=text]", "input[type=tel]"],
			"label"
		),
		textarea: new QuestionInfo("textarea", "textarea", "label"),
		number: new QuestionInfo("number", "input[type=number]", "label"),
		date: new QuestionInfo("date", "input[type=date]", "label"),
		radio: new QuestionInfo(
			"radio",
			"input[type=radio]",
			"legend",
			".//label/input//.."
		),
		select: new QuestionInfo("select", "select", "label", ".//select/option"),
		checkbox: new QuestionInfo(
			"checkbox",
			"input[type=checkbox]",
			["label", "legend"],
			".//label/input//.."
		),
	};

	status: Status;

	constructor() {
		this.status = Status.STOPPED;
	}

	getQuestionsInfo(): QuestionsInfo {
		return this.questionsInfo;
	}

	public async start(): Promise<void> {
		await launchBrowser();
		page.on("dialog", async dialog => {
			Logger.info(`Dialog appeared with message: ${dialog.message()}`);
			Logger.info("Accepting dialog");
			await dialog.accept();
		});
		browser.on("targetCreated", async () => {
			globalThis.pages = await global.browser.pages(); 
			Logger.info("A new tab or window was created.");
			Logger.info(`There are ${pages.length} page(s)`);
		});
		await Helper.checkTabs();
		const site = this.createSite();
		await site.goToJobsPage();
		this.status = Status.RUNNING;
		const locator = new Locator.Locator(site);
		await locator.signin();
		await this.run();
	}

	async stop() {
		Logger.info("Stopping applier 2");
		await globalThis.browser.close();
		await killDriverProcess();
	}

	pause() {
		Logger.info("Pausing bot");
		this.status = Status.PAUSED;
	}

	async resume() {
		Logger.info("Resuming bot");
		this.status = Status.RUNNING;
		await this.run();
	}

	async restart() {
		this.pause();
		await this.resume();
	}

	public abstract createSite(): Site;

	public async run(): Promise<void> {
		const site = this.createSite();
		const locator = new Locator.Locator(site);
		while (this.status === Status.RUNNING) {
			let locatorResult;
			try {
				locatorResult = await locator.getAction();
			} catch (e) {
				continue;
			}

			const { action, status, page } = locatorResult;

			if (status === "restart") {
				await this.restart();
			} else if (status === "success") {
				try {
					Logger.info(`Running action for ${page}`);
					await action();
					Logger.info(`Finished action for ${page}`);
				} catch (e) {
					Logger.error(`Something went wrong while running action ${page}. Error: ${e}`);
					await new Promise<void>((resolve) => {
						setTimeout(async () => {
							try {
								await action();
							} catch (e2) {
								Logger.error(
									`Something went wrong AGAIN while running action for ${page}, falling back`,
									e
								);
								Logger.info(`Status: ${this.status}`);
								if (this.status === Status.RUNNING) await site.goToJobsPage();
							}
							resolve();
						}, 5000);
					});
				}
			} else {
				await site.goToJobsPage();
			}
			await Helper.sleep(5000);
			await Helper.checkTabs();
		}
	}
}
