import translations from "store/state/translations"
import Device from "device.js/dist/device"
import Bowser from "bowser"

import config from "data/config.json"
import daynight from "data/daynight.json"
import objects from "data/objects.json"
import carConfig from "data/car.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

console.log(device)

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
	],
	defaultSettings: {
		soundMuted: false,
		physicsEnabled: true,
		gravityX: 0,
		gravityY: config.gravityY,
		speedCamera: true,
		freeCamera: false,
		freeCameraZ: 400,
		bumpmappingEnabled: true,
		bumpmapMultiplier: 1,
		saveChunks: true

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
	wonderMatterTestRenderer: !device.desktop ? false : false,
	isAndroid: device.android,
	saveChunks: false,
	wonderMatterTestRendererBounds: {
		x: 0,
		y: 0,
		width: 2000,
		height: 2000
	},
	physicsEnabled: true,
	gravityX: 0,
	gravityY: config.gravityY,
	speedCamera: true,
	freeCamera: false,
	freeCameraZ: 400,
	bumpmappingEnabled: true,
	bumpmapMultiplier: 0.75
};

export default state;