
import Device from "device.js/dist/device"
import Bowser from "bowser"

import { config, daynight, objects, car as carConfig } from "../../res/data/index.js"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

var state = {
	carConfig,
	config,
	daynight,
	objects: new Object(objects),
	savedProps: [
		"soundMuted",
		"gravityY",
		"enginePower",
		"groundFriction",
		"groundSkin",
		"timeScale",
		"fxEnabled",
		"version",
		"renderingResolution"
	],
	defaultSettings: {
		soundMuted: false,
		gravityY: config.gravityY,
		enginePower: 1,
		groundFriction: config.groundFriction,
		groundRestirution: config.groundRestirution,
		groundSkin: config.groundSkin,
		timeScale: 1,
		fxEnabled: true || (device.ios || device.desktop),
		version: "1.1",
		renderingResolution: (device.android ? 1 : window.devicePixelRatio)

	},
	isHybridApp: false,
	$root: null,
	paused: false,
	browserName: browser.getBrowserName().toLowerCase(),
	mobileDevice: !device.desktop,

	routes: {
		"main": ["contacts", "projects"],
		"projects": ["main", "contacts"],
		"contacts": ["projects", "main"]
	},
	currentPage: "main",

	mainThemePlays: false,
	soundMuted: false,
	pauseMenuShown: false,
	isAndroid: device.android,
	gravityY: config.gravityY,
	enginePower: 1,
	groundFriction: config.groundFriction,
	groundRestirution: config.groundRestirution,
	groundSkin: config.groundSkin,
	screenAspect: 1,
	timeScale: 1,
	fxEnabled: true,
	version: "1.1",
	renderingResolution: (device.android ? 1 : window.devicePixelRatio),
	DPR: window.devicePixelRatio
};

export default state;