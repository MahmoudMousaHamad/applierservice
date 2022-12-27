
import Logger from "../lib/Logger";
import { Site } from "../sites";
import { Helper } from ".";


export const SOURCE = "SOURCE";
export const TITLE = "TITLE";
export const TEXT = "TEXT";
export const URL = "URL";

export class Locator {
	site: Site;

	interval?: NodeJS.Timer;

	constructor(site: Site) {
		this.site = site;
	}

	async getAction() {
		const pageSource = await this.getPageSource();
		const pageTitle = await this.getTitle();

		for (const [key, value] of Object.entries(this.site.locationsAndActions)) {
			let string: string | undefined = "";
			try {
				if (value.type === TITLE) string = pageTitle;
				else if (value.type === SOURCE) string = pageSource;
				else if (value.type === TEXT)
					string = await Helper.getText("body");
				else string = globalThis.page.url();
			} catch (e) {
				Logger.error(
					"Something went wrong while getting the title or source of the page."
				);
				return { action: this.site.goToJobsPage, status: "failed" };
			}

			if (!string) return { action: this.site.goToJobsPage, status: "failed" };

			if (
				value.strings.some((s: string) =>
					string?.toLowerCase().includes(s.toLowerCase())
				)
			) {
				return {
					action: value.action,
					status: "success",
					page: key,
				};
			}
		}
		return {
			action: this.site.goToJobsPage,
			status: "not-found",
		};
	}

	async getTitle() {
		return await globalThis.page.title();
	}

	async getPageSource() {
		let source;
		try {
			source = await globalThis.page.content();
		} catch (e) {
			await this.site.goToJobsPage();
		}
		return source;
	}

	async signedIn() {
		return (await Helper.getElementsBy(this.site.selectors.signedIn)).length >= 1;
	}

	async signin() {
		const signedin = await this.signedIn();
		if (signedin) {
			Logger.info("User is signed in");
		} else {
			Logger.info("User is not signed in");
			await this.site.signin();
		}
	}
}
