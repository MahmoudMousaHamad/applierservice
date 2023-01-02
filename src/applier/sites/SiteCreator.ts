import { Dialog } from "puppeteer";

import { QuestionInfo, QuestionsInfo } from "../jobapplication/Question";
import { killDriverProcess, Locator, Helper } from "../driver";
import { launchBrowser } from "../driver/Manager";
import { Site, Status } from "./Site";
import { Logger } from "../lib";

export default abstract class SiteCreator {
	public abstract createSite(userId: string): Site;

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

	userId: string;

	helper: Helper;

	constructor(userId: string) {
		this.status = Status.STOPPED;
		this.userId = userId;
		this.helper = Helper.getInstance(userId);
	}

	getQuestionsInfo(): QuestionsInfo {
		return this.questionsInfo;
	}

	public async start(): Promise<void> {
		await launchBrowser(this.userId);

		pages[this.userId].on("dialog", async (dialog: Dialog) => {
			console.log(`Dialog appeared with message: ${dialog.message()}`);
			console.log("Accepting dialog");
			await dialog.accept();
		});
		
		await this.helper.checkTabs();
		const site = this.createSite(this.userId);
		await site.goToJobsPage();
		this.status = Status.RUNNING;
		const locator = new Locator.Locator(site, this.userId);
		await locator.signin();
		await this.run();
	}

	async stop() {
		await browsers[this.userId]?.close();
		// await killDriverProcess();
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


	public async run(): Promise<void> {
		const site = this.createSite(this.userId);
		const locator = new Locator.Locator(site, this.userId);
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
			await this.helper.sleep(5000);
			await this.helper.checkTabs();
		}
	}
}
