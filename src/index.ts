import express from "express";
import axios from "axios";
import cors from "cors";

import { Logger } from "./applier/lib";
import config  from "./server/config";
import Route from "./server/routes";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/applier", Route);

const server = app.listen(config.PORT, () => {
    Logger.info(`🚀 Applier service started at port ${config.PORT}`);
    Logger.info(`Main server endpoint is ${config.serverEndpoint}`);
});

server.on("questions", async (questions) => {
    Logger.info(`Sending questions to main service. Questions: ${JSON.stringify(questions)}`);
    try {
        const response = await axios.post(`${config.serverEndpoint}api/qa/questions`, {
            questions: JSON.stringify(questions),
            userId: userData.userId,
        });
    } catch(e) {
        Logger.error(`Something went wrong while sending questions to the main service. Error details: ${e}`);
    }
});

server.on("application-submitted", async () => {
    try {
        if (!userData) throw Error("User info was not initialized");
        const response = await axios.post(`${config.serverEndpoint}api/applications/updateCount`, {
            userId: userData.userId,
        });
    } catch(e) {
        Logger.error(`Something went wrong while sending application submitted to main service. Error details: ${e}`);
    }
});

export {server, app};
