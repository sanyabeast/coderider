import _ from "Helpers";
import Device from "device.js/dist/device"
import Bowser from "bowser"

import config from "data/config.json"
import daynight from "data/daynight.json"
import objects from "data/objects.json"
import carConfig from "data/car.json"
import packageData from "../../package.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

import Benchmark from "Benchmark"

window.Benchmark = Benchmark


var getters = {
	performanceIndex ( state ) {

		if ( state.performanceIndex > 0 ) {
			return state.performanceIndex
		}

		let benchmark = new Benchmark()
		let index = benchmark.run().index
		return index
	},	
	translation ( state ) {
		return state.translations[ state.language ]
	},
	routes ( state ) {
		return state.routes[ state.currentPage ]
	},
	defaultSettings ( state, getters ) {
		state.performanceIndex = -1

		let performanceIndex = getters.performanceIndex
		
		return {
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
			performanceIndex: performanceIndex

		}
	}
};

export default getters;      