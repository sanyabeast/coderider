import _ from "Helpers";
import Device from "device.js/dist/device"
import Bowser from "bowser"

import { config, daynight, objects, car as carConfig } from "data/index.js"
import packageData from "../../package.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

var getters = {



	defaultSettings ( state, getters ) {
		// Use simplified settings based on device rather than performance
		let bumpmappingEnabled = device.desktop || device.ios
		let renderingResolution = device.desktop || device.ios ? state.DPR : 1
		let fxEnabled = device.desktop || device.ios

		return {
			soundMuted: false,
			physicsEnabled: true,
			gravityX: 0,
			gravityY: config.gravityY,
			speedCamera: true,
			freeCamera: false,
			freeCameraZ: 400,
			bumpmappingEnabled: bumpmappingEnabled,
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
			fxEnabled: fxEnabled,
			version: packageData.version,
			renderingResolution: renderingResolution

		}
	}
};

export default getters;      