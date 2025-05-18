import translations from "store/state/translations"
import Device from "device.js/dist/device"
import Bowser from "bowser"

import config from "data/config.json"
import daynight from "data/daynight.json"
import objects from "data/objects.json"
import carConfig from "data/car.json"
import packageData from "../../package.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

window.device = device


var state = {

	carConfig,
	config,
	daynight,
	objects: new Object( objects ),
	savedProps: [
		"soundMuted",
		"bumpmappingEnabled",
		"bumpmapMultiplier",
		"freeCamera",
		"speedCamera",
		"freeCameraZ",
		"gravityX",
		"gravityY",
		"physicsEnabled",
		"saveChunks",
		"enginePower",
		"groundFriction",
		"groundSkin",
		"wireframeMode",
		"wonderMatterTestRenderer",
		"wonderMatterTestRendererSize",
		"timeScale",
		"fxEnabled",
		"version",
		"renderingResolution",
		"performanceIndex"
	],
	defaultSettings: {
		soundMuted: false,
		physicsEnabled: true,
		gravityX: 0,
		gravityY: config.gravityY,
		speedCamera: true,
		freeCamera: false,
		freeCameraZ: 400,
		bumpmappingEnabled: !device.android,
		bumpmapMultiplier: 0.5,
		saveChunks: false,
		enginePower: 1,
		groundFriction: config.groundFriction,
		groundRestirution: config.groundRestirution,
		groundSkin: config.groundSkin,
		wireframeMode: false,
		wonderMatterTestRenderer: false,
		wonderMatterTestRendererSize: 1,
		timeScale: 1,
		fxEnabled: true || (device.ios || device.desktop),
		version: packageData.version,
		renderingResolution: ( device.android ? 1 : window.devicePixelRatio ),
		performanceIndex: -1

	},
	isHybridApp: typeof window.native == "object",
	$root: null,
	paused: false,
	browserName: browser.getBrowserName().toLowerCase(),
	mobileDevice: !device.desktop,
	/*l18n*/
	language : "ukr",
	routes: {
		"main": [ "contacts", "projects" ],
		"projects": [ "main", "contacts" ],
		"contacts": [ "projects", "main" ]
	},
	currentPage: "main",
	translations: translations,
	mainThemePlays: false,
	soundMuted: false,
	pauseMenuShown: false,
	settingsMenuShown: false,
	wonderMatterTestRenderer: false,
	isAndroid: device.android,
	saveChunks: false,
	wonderMatterTestRendererBounds: {
		x: 500,
		y: 0,
		width: 1000,
		height: 1000
	},
	physicsEnabled: true,
	gravityX: 0,
	gravityY: config.gravityY,
	speedCamera: true,
	freeCamera: false,
	freeCameraZ: 400,
	bumpmappingEnabled: false, // Disabled by default to avoid texture loading issues
	bumpmapMultiplier: 0.5,
	enginePower: 1,
	groundFriction: config.groundFriction,
	groundRestirution: config.groundRestirution,
	groundSkin: config.groundSkin,
	wireframeMode: false,
	wonderMatterTestRendererSize: 1,
	screenAspect: 1,
	timeScale: 1,
	fxEnabled: true,
	version: packageData.version,
	renderingResolution: ( device.android ? 1 : window.devicePixelRatio ),
	DPR: window.devicePixelRatio,
	performanceIndex: -1
};

export default state;