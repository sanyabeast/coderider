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
	],
	defaultSettings: {
		soundMuted: false,
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
	wonderWheelRadius: 3,
	wonderPathSmoothingPeriod: 3,
	wonderWheelAngularVelocity: 0.1,
	wonderMatterTestRenderer: !device.desktop ? false : true,
	isAndroid: device.android,
	wonderMatterTestRendererBounds: {
		x: 0,
		y: 0,
		width: 2000,
		height: 2000
	}
};

export default state;