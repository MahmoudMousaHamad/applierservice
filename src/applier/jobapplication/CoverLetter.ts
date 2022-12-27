import { ElementHandle } from "puppeteer";

import { Preferences } from "../lib";

import Job from "./Job";

export default class CoverLetter {
	preferences: Preferences;

	element: ElementHandle;

	job: Job;

	constructor(preferences: Preferences, element: ElementHandle, job: Job) {
		this.preferences = preferences;
		this.element = element;
		this.job = job;
	}

	replaceTokens(): string {
		const { coverLetter } = this.preferences;
		const tokens = {
			company: {
				replace: () => this.job.company,
			},
			position: {
				replace: () => this.job.position,
			},
			custom_paragraph: {
				replace: () => this.preferences.titles[this.job.searchedJobTitle],
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
