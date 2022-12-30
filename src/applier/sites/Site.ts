import { ElementHandle, Frame } from "puppeteer";

import { QuestionsInfo } from "../jobapplication/Question";
import { Job } from "../jobapplication";
import { Helper } from "../driver";
import { Logger } from "../lib";

export enum Status {
	RESTART,
	RUNNING,
	STOPPED,
	PAUSED,
}

interface LocationAction {
	[location: string]: {
		action(): Promise<void>;
		strings: string[];
		type: string;
	};
}

export interface SiteInterface {
	locationsAndActions: LocationAction;
	questionsInfo: QuestionsInfo;
	selectors: any;

	submitApplication(): Promise<void>;
	answerQuestions(): Promise<void>;
	goToJobsPage(): Promise<void>;
	signin(): Promise<boolean>;
}

interface JobSearchParams {
	[name: string]: {
		value: string;
		name: string;
	};
}

export abstract class Site implements SiteInterface {
	abstract answerQuestions(): Promise<void>;
	abstract goToJobsPage(): Promise<void>;
	abstract signin(): Promise<boolean>;

	questionsInfo: QuestionsInfo;

	locationsAndActions: {
		[name: string]: { strings: string[]; type: string; action: () => any };
	};

	jobSearchParams?: JobSearchParams;

	submittedDate?: Date;

	selectors: {
		[name: string]: { selector: string; xpath: boolean };
	};

	job?: Job;

	helper: Helper;

	userId: string;

	constructor(selectors: any, questionsInfo: QuestionsInfo, userId: string) {
		this.helper = Helper.getInstance(userId);
		this.questionsInfo = questionsInfo;
		this.locationsAndActions = {};
		this.selectors = selectors;
		this.userId = userId;
	}

	async enterApplication() {
		const cards = await this.helper.getElementsBy(this.selectors.cards);
		for (const card of cards) {
			const cardText = await this.helper.getElementText(card);
			try {
				if (cardText.includes("Applied")) continue;
			} catch (e) {
				continue;
			}
			await card.click();
			await this.helper.sleep(2000);
			let applyButton = await this.helper.getElementBy(this.selectors.applyButton) as ElementHandle;
			if (this.selectors.jobCard) {
				const frame = await this.helper.getElementBy(this.selectors.jobCard);
				if (frame) {
					const frameContent = await frame?.contentFrame() as Frame;
					[applyButton] = await frameContent.$x(this.selectors.applyButton.selector) as ElementHandle[];
				}
			}
			if (applyButton) {
				Logger.info("Attempting to click apply button");
				await applyButton.click();
				return;
			} else {
				Logger.info("Apply button was not found");
			}
		}
		await this.goToJobsPage();
	}

	async getJobInfo(): Promise<void> {
		const company = await this.helper.getElementText((await this.helper.getElementsBy(this.selectors.companyName))[0]);
		const position = await this.helper.getElementText((await this.helper.getElementsBy(this.selectors.position))[0]);
		Logger.info("Job info:", position, company);
		this.job = new Job(
			position,
			company,
			"no-description",
			this.jobSearchParams?.title?.value as string
		);
	}

	async resumeSection() {
		await this.getJobInfo();
		await this.helper.sleep(1000);
		await this.continue();
	}

	async submitApplication() {
		await this.continue();
	}

	async exitApplication() {
		await this.goToJobsPage();
		await this.helper.sleep(1000);
	}

	async handleDoneAnsweringQuestions() {
		await this.continue();
		if ((await this.helper.getElementsBy(this.selectors.errors)).length > 0) await this.exitApplication();
	}

	async continue() {
		(await this.helper.getElementsBy(this.selectors.nextButton))[0].click();
	}
}
