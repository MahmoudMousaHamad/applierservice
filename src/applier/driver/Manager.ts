/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/always-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable promise/no-nesting */
/* eslint-disable global-require */
/* eslint-disable new-cap */
import chrome from "selenium-webdriver/chrome";
import { exec } from "child_process";
import unzipper from "unzipper";
import https from "https";
import path from "path";
import fs from "fs";

import { Logger, OS } from "../lib";

const {
	userChromeDataDir,
	chromeDriverPath,
	appDatatDirPath,
	targetPlatform,
	isWindows,
} = OS;

const versionIndex: {[key: number]: string} = {
	108: "108.0.5359.71",
	106: "106.0.5249.21",
	105: "105.0.5195.52",
	104: "104.0.5112.29",
	103: "103.0.5060.53",
	102: "102.0.5005.61",
	101: "101.0.4951.41",
	100: "100.0.4896.60",
};

const chromeRemoteDebugPort = 9222;

export async function getChromeMajorVersion() {
	const chromeVersion = await require("find-chrome-version")();
	const chromeMajorVersion = chromeVersion.split(".")[0];

	Logger.info(`Chrome major version: ${chromeMajorVersion}`);

	return chromeMajorVersion;
}

export async function downloadChromeDriver() {
	const chromeMajorVersion = await getChromeMajorVersion();

	if (!chromeMajorVersion)
		throw Error("Chrome version is not compatibale with this application.");

	if (!fs.existsSync(appDatatDirPath)) {
		fs.mkdirSync(appDatatDirPath);
	}

	const fileUrl = `https://chromedriver.storage.googleapis.com/${
		versionIndex[await getChromeMajorVersion()]
	}/chromedriver_${targetPlatform}.zip`;

	Logger.info(`Zip file url ${fileUrl}`);

	const file = fs.createWriteStream(
		path.join(appDatatDirPath, "chromedriver.zip")
	);
	
	await new Promise<void>((r) => {
		https.get(fileUrl, (response) => {
			response.pipe(file);
	
			Logger.info("Downloading chrome driver...");
	
			// after download completed close filestream
			file.on("finish", async () => {
				file.close();
				Logger.info("Download of chrome driver file ended, unzipping...");
	
				fs.createReadStream(path.join(appDatatDirPath, "chromedriver.zip")).pipe(
					unzipper.Extract({ path: path.join(appDatatDirPath, "chromedriver") })
				);
	
				await new Promise((resolve) => setTimeout(resolve, 1000));
	
				fs.chmodSync(chromeDriverPath, "755");

				r();
			});
	
			file.on("error", Logger.error);
		});
	}); 
}

export async function openChromeSession() {
	if (!fs.existsSync(userChromeDataDir)) {
		fs.mkdirSync(userChromeDataDir);
	}

	let chromeCommand;

	if (isWindows) {
		const chrome86Path =
			"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
		const chromePath =
			"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
		if (!(fs.existsSync(chrome86Path) || fs.existsSync(chromePath))) {
			throw Error(`
				It looks like Chrome is not installed. Please make sure that Chrome
				is installed correctly in ${chrome86Path} or ${chromePath}.
        	`);
		}
		chromeCommand = fs.existsSync(chrome86Path)
			? `"${chrome86Path}"`
			: `"${chromePath}"`;
	} else {
		chromeCommand = "google-chrome";
	}

	// TODO: Use chrome-launcher to launch chrome
	const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${await getChromeMajorVersion()}.0.0.0 Safari/537.36`;

	exec(
		`${chromeCommand} \
		--remote-debugging-port=${chromeRemoteDebugPort} \
		--user-data-dir=${userChromeDataDir} \
		--user-agent="${userAgent}" \
		--start-maximized \
		--headless
		`,
		(error, stdout, stderr) => {
			if (stdout) Logger.info(`stdout: ${stdout}`);
			if (stderr) Logger.error(`stderr: ${stderr}`);
			if (error) Logger.error(`exec error: ${error}`);
		}
	);
}

export async function attachToSession() {
	const myChromePath = path.join(
		appDatatDirPath,
		"chromedriver",
		`chromedriver${isWindows ? ".exe" : ""}`
	);
	Logger.info(`Chrome driver path: ${myChromePath}`);
	Logger.info(`User data directory: ${userChromeDataDir}`);

	const service = new chrome.ServiceBuilder(myChromePath)
		.enableVerboseLogging()
		.build();

	const options = new chrome.Options();
	options.debuggerAddress(`localhost:${chromeRemoteDebugPort}`);

	const driver = chrome.Driver.createSession(options, service);
	
	driver.executeScript(`
		Object.defineProperty(navigator, 'plugins', {
			get: function() {
			return [1, 2, 3, 4, 5];
			},
		});

		const getParameter = WebGLRenderingContext.getParameter;
		WebGLRenderingContext.prototype.getParameter = function(parameter) {
		// UNMASKED_VENDOR_WEBGL
		if (parameter === 37445) {
			return 'Intel Open Source Technology Center';
		}
		// UNMASKED_RENDERER_WEBGL
		if (parameter === 37446) {
			return 'Mesa DRI Intel(R) Ivybridge Mobile ';
		}

		return getParameter(parameter);
		};

		['height', 'width'].forEach(property => {
			// store the existing descriptor
			const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property);
		  
			// redefine the property with a patched descriptor
			Object.defineProperty(HTMLImageElement.prototype, property, {
			  ...imageDescriptor,
			  get: function() {
				// return an arbitrary non-zero dimension if the image failed to load
				if (this.complete && this.naturalHeight == 0) {
				  return 20;
				}
				// otherwise, return the actual dimension
				return imageDescriptor.get.apply(this);
			  },
			});
		  });

		  // store the existing descriptor
		  const elementDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
		  
		  // redefine the property with a patched descriptor
		  Object.defineProperty(HTMLDivElement.prototype, 'offsetHeight', {
			...elementDescriptor,
			get: function() {
			  if (this.id === 'modernizr') {
				  return 1;
			  }
			  return elementDescriptor.get.apply(this);
			},
		  });
	`);

	return driver;
}

export async function killDriverProcess() {
	const kill = require("kill-port");
	try {
		await kill(chromeRemoteDebugPort, "tcp");
	} catch (e) {
		Logger.error(e);
	}
}
