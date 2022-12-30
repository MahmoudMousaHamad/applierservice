import { CoverLetter, Job, QnAManager } from "../jobapplication";
import { UserData, Logger } from "../lib";
import { Locator } from "../driver";

import SiteCreator from "./SiteCreator";
import { Site } from "./Site";
import {server} from "../..";
import { ElementHandle, Frame } from "puppeteer";

const { SOURCE, TITLE } = Locator;

export class IndeedSite extends Site {
	locationsAndActions = {
		jobs: {
			strings: ["Job Search", "Jobs, Employment", "Flexible"],
			type: TITLE,
			action: this.enterApplication.bind(this),
		},
		resume: {
			strings: ["Add a resume"],
			type: SOURCE,
			action: this.resumeSection.bind(this),
		},
		questions: {
			strings: ["answer", "questions"],
			type: TITLE,
			action: this.answerQuestions.bind(this),
		},
		experience: {
			strings: ["Select a past job that shows relevant experience", 
			"Highlight a job that shows relevant experience"],
			type: SOURCE,
			action: this.chooseExperience.bind(this),
		},
		letter: {
			strings: [
				"Want to include any supporting documents?",
				"requests a cover letter for this application",
				"Consider adding supporting documents",
			],
			type: SOURCE,
			action: this.chooseLetter.bind(this),
		},
		missingQualifications: {
			strings: [
				"is looking for these qualifications",
				"Do you have these qualifications from the job description?",
			],
			type: SOURCE,
			action: this.continueToApplication.bind(this),
		},
		submit: {
			strings: [
				"Review the contents of this job application",
				"Please review your application",
			],
			type: TITLE,
			action: this.submitApplication.bind(this),
		},
		submitted: {
			strings: ["Your application has been submitted!", "One more step"],
			type: SOURCE,
			action: async () => {
				server.emit("application-submitted", this.userId);
				await this.goToJobsPage();
				this.submittedDate = new Date();
			},
		},
	};

	async goToJobsPage(): Promise<void> {
		const location =
			UserData.locations[
				Math.floor(Math.random() * UserData.locations.length)
			];

		const title =
			UserData.titles[
				Math.floor(Math.random() * UserData.titles.length)
			];

		this.jobSearchParams = {
			experience: UserData.experienceLevel,
			type: UserData.jobType,
			location,
			title,
		};

		await pages[this.userId].goto(
			`https://www.indeed.com/jobs?q=${title}&l=${location}&sc=0kf%3Aexplvl(${UserData.experienceLevel})jt(${UserData.jobType})`,
			{ waitUntil: "networkidle0" }     // <-- Make sure the whole page is completely loaded
		);
	}

	async signin(): Promise<boolean> {
		await pages[this.userId].goto('https://indeed.com');
		// await this.helper.sleep(5000);
		// const googleFrame = await pages[this.userId].$("#credential_picker_container iframe");
		// if (googleFrame) {
		// 	Logger.info("Found Google sign in frame");
		// 	const frameContent = await googleFrame?.contentFrame() as Frame;
		// 	const continueAs = await frameContent.$("//div[contains(text(), 'Continue as')]/..");
		// 	await continueAs?.click();
		// 	Helper.sleep(2000);
		// 	return true;
		// }
	    const [button] = await pages[this.userId].$x("//a[contains(text(),'Sign in')]") as ElementHandle[];
		await button.click();
		await this.helper.sleep(1000);
	    const [googleBtn] = await pages[this.userId].$$("#login-google-button") as ElementHandle[];
		if (!googleBtn) throw Error("Google button was not found");
		await googleBtn.click();
		await this.helper.sleep(2000);
		if (pageses[this.userId].length > 1) {
			const googlePage = pageses[this.userId][pageses[this.userId].length - 1];
			await googlePage.type("input[type='email']", "mahmoudmousahamad\n", {delay: 20});
			await this.helper.sleep(1000);
			await googlePage.type("input[type='password']", "5337301Mh!\n", {delay: 20});
		}
		return true;
	}

	async answerQuestions() {
		await new QnAManager(this).startWorkflow();
	}

	async chooseExperience() {
		await this.helper.sleep(1000);
		await this.continue();
	}

	async chooseLetter() {
		try {
			await (await this.helper.getElementsBy(this.selectors.coverLetter))[3].click();
		} catch (e) {
			Logger.error(e);
		}
		await this.helper.sleep(1000);
		if (
			UserData?.coverLetter &&
			UserData?.coverLetter !== ""
		) {
			const [textarea] = await this.helper.getElementsBy(this.selectors.textarea);
			await this.helper.clearInput(this.selectors.textarea.selector);
			const coverLetter = new CoverLetter(
				UserData,
				textarea,
				this.job as Job
			);
			await coverLetter.fill();
		}
		await this.helper.sleep(1000);
		await this.continue();
	}

	async continueToApplication() {
		await this.continue();
	}
}

export class IndeedSiteCreator extends SiteCreator {
	public createSite(userId: string): Site {
		const selectors = {
			errors: {
				selector: "//div[@class='css-mllman e1wnkr790']",
				xpath: true,
			},
			bigJobCard: {
				selector: "#vjs-container-iframe",
				xpath: false,
			},
			applyButton: {
				// selector: "#indeedApplyButton",
				selector: ".jobsearch-IndeedApplyButton-buttonWrapper button",
				xpath: false,
			},
			nextButton: {
				selector: ".ia-continueButton",
				xpath: false,
			},
			coverLetter: {
				selector: "div.css-kyg8or",
				xpath: false,
			},
			cards: {
				selector: ".cardOutline",
				xpath: false,
			},
			signedIn: {
				selector: "#AccountMenu",
				xpath: false,
			},
			textarea: {
				selector: "textarea",
				xpath: false,
			},
			companyName: {
				selector: ".ia-JobHeader-information span",
				xpath: false,
			},
			position: {
				selector: ".ia-JobHeader-information h2",
				xpath: false,
			},
			questionsXpathPrefex: {
				selector: "",
				xpath: true,
			},
			jobCard: {
				selector: "iframe.jobsearch-ViewJobContainer-inner",
				xpath: false,
			}
		};
		return new IndeedSite(selectors, super.getQuestionsInfo(), userId);
	}
}
