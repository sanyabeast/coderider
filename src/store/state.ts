
import Device from "device.js/dist/device"
import Bowser from "bowser"

import { config, daynight, objects, carConfig as carConfig } from "../../res/data/data"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

var state = {
	$root: null,
	paused: false,
	browserName: browser.getBrowserName().toLowerCase(),
	mobileDevice: !device.desktop,
	mainThemePlays: false,
	pauseMenuShown: false,
	isAndroid: device.android,
	version: "1.1",
	DPR: window.devicePixelRatio
};

export default state;