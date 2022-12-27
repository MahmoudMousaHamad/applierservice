import express from "express";

import { start, stop, getStatus, answers, config, resume, pause, screenshot } from "./controllers";

const Route = express.Router();

Route.post("/config", config);

Route.get("/controller/screenshot", screenshot);
Route.get("/controller/status", getStatus);
Route.get("/controller/resume", resume);
Route.get("/controller/start", start);
Route.get("/controller/pause", pause);
Route.get("/controller/stop", stop);

Route.post("/qa/answers", answers);

export default Route;

