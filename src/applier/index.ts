import { Browser, Page } from "puppeteer";
import { Response } from "express";

import { IndeedSiteCreator, LinkedInSiteCreator, Status } from "./sites";
import { SingletonCategorizer } from "./lib/Categorizer";
import { Driver, killDriverProcess } from "./driver";
import { Logger, UserData } from "./lib";

declare global {
    var browser: Browser;
    var userData: any;
    var pages: Page[];
    var page: Page;
}

class Applier {
    private linkedin: LinkedInSiteCreator;

    private indeed: IndeedSiteCreator;

    private driver: Driver;

    constructor () {
        this.linkedin = new LinkedInSiteCreator();
        this.indeed = new IndeedSiteCreator();
        this.driver = new Driver(this.linkedin);
    }

    async start(userData: any, answers: any, res: Response) {
        if (this.driver.getStatus() !== Status.RUNNING) {
            if (userData.site === "INDEED") this.driver = new Driver(this.indeed);
            else if (userData.site === "LINKEDIN") this.driver = new Driver(this.linkedin);
            else {
                res.status(403).send("Site parameter is invalid");
                return;
            }
            Logger.info(`Site: ${userData?.site}`);
            if (!SingletonCategorizer.load(answers) || !UserData.set(userData)) {
                res.status(403).send("User data object is invalid");
                return;
            }
            res.status(200).json({status: Status.RUNNING});
            await this.driver.start();
        } else {
            res.status(403).json({
                status: Status.RUNNING,
                error: "Applier is already running"
            });
        }
    }

    async stop(res?: Response) {
        if (this.driver.getStatus() === Status.RUNNING || this.driver.getStatus() == Status.PAUSED) {
            await this.driver.stop();
            await killDriverProcess();
            res?.status(200).json({
                answers: JSON.stringify(SingletonCategorizer.categorizer),
                status: this.getStatus(),
            });
        } else {
            res?.status(500).json({
                status: this.getStatus(),
                error: "Applier is already stopped"
            });
        }
    }

    async pause(res: Response) {
        if (this.driver.getStatus() === Status.RUNNING) {
            res.status(200).json({
                status: Status.PAUSED,
            });
            await this.driver.pause();
        } else {
            res.status(500).json({
                error: "Pause is not possible; the applier service is not running."
            });
        }
    }

    async resume(res: Response) {
        if (this.driver.getStatus() === Status.PAUSED) {
            await this.driver.resume();
            res.status(200).json({
                status: this.getStatus(),
            });
        } else {
            res.status(500).json({
                error: "Resume is not possible; the applier service is not paused."
            });
        }
    }

    async screenshot(p: string) {
        await page.screenshot({ path: p });
    }

    getStatus(): Status {
        return this.driver.getStatus();
    }
}

export default Applier;
