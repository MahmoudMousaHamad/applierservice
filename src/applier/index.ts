import { Browser, Page } from "puppeteer";
import { Response } from "express";

import { IndeedSiteCreator, LinkedInSiteCreator, SiteCreator, Status } from "./sites";
import { SingletonCategorizer } from "./lib/Categorizer";
import { killDriverProcess } from "./driver";
import { Logger, UserData } from "./lib";

declare global {
    var browsers: { [userId: string]: Browser };
    var pages: { [userId: string]: Page };
}

globalThis.browsers = {};
globalThis.pages = {};

class Applier {
    site: SiteCreator;

    userId: string;

    constructor (userId: string) {
        this.site = new LinkedInSiteCreator(userId);
        this.userId = userId; 
    }

    async start(userData: any, answers: any, res: Response) {
        if (this.getStatus() !== Status.RUNNING) {
            if (userData.site === "INDEED") this.site = new IndeedSiteCreator(this.userId);
            else if (userData.site === "LINKEDIN") this.site = new LinkedInSiteCreator(this.userId);
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
            await this.site.start();
        } else {
            res.status(403).json({
                status: Status.RUNNING,
                error: "Applier is already running"
            });
        }
    }

    async stop(res: Response) {
        if (this.getStatus() === Status.RUNNING || this.getStatus() == Status.PAUSED) {
            await this.site.stop();
            // await killDriverProcess();
            res.status(200).json({
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

    pause(res: Response) {
        if (this.getStatus() === Status.RUNNING) {
            res.status(200).json({
                status: Status.PAUSED,
            });
            this.site.pause();
        } else {
            res.status(500).json({
                error: "Pause is not possible; the applier service is not running."
            });
        }
    }

    async resume(res: Response) {
        if (this.getStatus() === Status.PAUSED) {
            await this.site.resume();
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
        await pages[this.userId].screenshot({ path: p });
    }

    getStatus(): Status {
        return this.site.status;
    }
}

export default Applier;
