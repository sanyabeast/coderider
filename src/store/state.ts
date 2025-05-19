
import Device from "device.js/dist/device"
import Bowser from "bowser"

import { config, daynight, objects, carConfig as carConfig } from "../../res/data/data"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

var state = {
	$root: null,
	paused: false
};

export default state;