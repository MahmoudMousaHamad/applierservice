import { ElementHandle } from "puppeteer";

import { IUserData } from "../lib/UserData";

import Job from "./Job";

export default class CoverLetter {
	userData: IUserData

	element: ElementHandle;

	job: Job;

	constructor(userData: IUserData, element: ElementHandle, job: Job) {
		this.userData = userData;
		this.element = element;
		this.job = job;
	}

	replaceTokens(): string {
		const { coverLetter } = this.userData;
		const tokens = {
			company: {
				replace: () => this.job.company,
			},
			position: {
				replace: () => this.job.position,
			},
			custom_paragraph: {
				replace: () => this.userData.titles[this.job.searchedJobTitle],
			},
		};

		for (const [token, { replace }] of Object.entries(tokens)) {
			coverLetter.replace(new RegExp(`[[${token}]]`, "g"), replace());
		}

		return coverLetter;
	}

	async fill() {
		await this.element.type(this.replaceTokens());
	}
}
