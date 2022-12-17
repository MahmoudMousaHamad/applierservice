import express from "express";

import { start, stop, getStatus, submitAnswers } from "./controllers";

const Route = express.Router();

Route.get("/controller/status", getStatus);
Route.get("/controller/start", start);
Route.get("/controller/stop", stop);

Route.post("/qa/submitAnswers", submitAnswers);

export default Route;

