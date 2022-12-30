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

server.on("questions", async ({ questions, userId }) => {
    Logger.info(`Sending questions to main service. Questions: ${JSON.stringify(questions)}`);
    try {
        await axios.post(`${config.serverEndpoint}api/qa/questions`, {
            questions,
            userId,
        });
    } catch(e) {
        Logger.error(`Something went wrong while sending questions to the main service. Error details: ${e}`);
    }
});

server.on("application-submitted", async (userId) => {
    try {
        if (!userId) throw Error("User ID was not provided");
        await axios.post(`${config.serverEndpoint}api/applications/updateCount`, { userId });
    } catch(e) {
        Logger.error(`Something went wrong while sending application submitted to main service. Error details: ${e}`);
    }
});

export {server, app};
