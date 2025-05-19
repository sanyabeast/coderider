import _ from "../Helpers";
import Device from "device.js/dist/device"
import Bowser from "bowser"

import { config, daynight, objects, car as carConfig } from "../../res/data/index"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

var getters = {

	defaultSettings(state, getters) {
		// Use simplified settings based on device rather than performance
		let renderingResolution = device.desktop || device.ios ? state.DPR : 1
		let fxEnabled = device.desktop || device.ios

		return {
			soundMuted: false,
			gravityY: config.gravityY,
			enginePower: 1,
			groundFriction: config.groundFriction,
			groundRestirution: config.groundRestirution,
			groundSkin: config.groundSkin,
			timeScale: 1,
			fxEnabled: fxEnabled,
			version: "1.1",
			renderingResolution: renderingResolution

		}
	}
};

export default getters;      