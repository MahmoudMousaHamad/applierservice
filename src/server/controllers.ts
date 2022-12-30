import { validationResult } from "express-validator";
import { Request, Response } from "express";
import appRootPath from "app-root-path";
import path from "path";

import { Status } from "../applier/sites";
import { Logger } from "../applier/lib";
import Applier from "../applier";
import {server} from "../index";

import Config from "./config";

const appliers: { [userId: string]: Applier } = {};

const getApplier = (userId: string): Applier => {
    if (appliers[userId]) return appliers[userId];
    appliers[userId] = new Applier(userId);
    return appliers[userId];
};

const controllerTemplate = (controller: Function) => {
    return async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array()
            });
        }
        try {
            await controller(req, res);
        } catch (e: any) {
            Logger.error(String(e));
            res.status(500).send("Error! Error details: " + e);
        }
    }
}

const start = async (req: Request, res: Response) => {
    await getApplier(req.body.userId).start(req.body, req.body.answers, res);
};

const stop = controllerTemplate(async (req: Request, res: Response) => {
    await getApplier(req.body.userId).stop(res);
});

const pause = (req: Request, res: Response) => {
    getApplier(req.body.userId).pause(res);
};

const resume = async (req: Request, res: Response) => {
    await getApplier(req.body.userId).resume(res);
};

const getStatus = controllerTemplate(async (req: Request, res: Response) => {
    res.status(200).json({
        status: getApplier(req.body.userId).getStatus(),
    });
});

const answers = controllerTemplate(async (req: Request, res: Response) => {
    const {answers, userId} = req.body;
    server.emit("answers", { answers, userId });
});

const screenshot = controllerTemplate(async (req: Request, res: Response) => {
    const status = getApplier(req.body.userId).getStatus();
    const p = path.resolve(appRootPath.toString(), "screenshot.png");
    if (status === Status.RUNNING || status === Status.PAUSED) {
        await getApplier(req.body.userId).screenshot(p);
        res.status(200).json({
            message: "Screenshot saved at " + p,
            status,
        });
    } else {
        res.status(500).json({
            error: "Applier is not running or is paused",
        });
    }
});

const config = controllerTemplate(async (req: Request, res: Response) => {
    const {address, port} = req.body;
    if (!address || !port) throw Error("Not all config variables (address and port) are present");
    Config.serverEndpoint = `http://${address}:${port}/`;
    Logger.info("Main service url: " + Config.serverEndpoint);
    res.status(200).send("Config object set successfully");
});

export { start, stop, getStatus, answers, config, pause, resume, screenshot };
