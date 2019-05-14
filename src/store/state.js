import translations from "store/state/translations"
import Device from "device.js/dist/device"
import Bowser from "bowser"

import wlConfig from "data/wonderland.config.json"

const browser = Bowser.getParser(window.navigator.userAgent);
const device = new Device()

console.log(device)

var state = {
	savedProps: [
		"soundMuted",
		"bumpmappingEnabled",
        "bumpmappingLevel",
        "lightsDistance",
        "lightsIntensity",
        "lightAColor",
        "lightBColor",
        "gyroGravityEnabled",
        "physicEnabled",
        "matterObjectsFriction",
        "matterObjectsRestitution",
        "matterObjectsFrictionAir",
        "backgroundShader",
        "backgroundEnabled"
	],
	defaultSettings: {
		soundMuted: false,
		bumpmappingEnabled: true,
		bumpmappingLevel: wlConfig.bumpmappingLevel,
		lightsDistance: 300,
		lightsIntensity: 1.6,
		lightAColor: '#F64272',
		lightBColor: '#51e5db',
		gyroGravityEnabled: device.android,
		physicEnabled: true,
		matterObjectsFriction: 0.01,
		matterObjectsRestitution: 0.01,
		matterObjectsFrictionAir: 0.01,
		backgroundEnabled: true,
		backgroundShader: "stars"
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
	bumpmappingEnabled: true,
	bumpmappingLevel: wlConfig.bumpmappingLevel,
	totalScore: 0,
	renderingActive: true,
	mainThemePlays: false,
	soundMuted: false,
	lightsDistance: 300,
	lightsIntensity: 1.6,
	lightColors:[
		['#F64272', '#F6648B', '#F493A7', '#F891A6', '#FFCCD5' ],
	    ['#8b5aff', '#a27bff', '#b99cff', '#d0bdff', '#e8deff' ],
	    ['#51e5db', '#74ebe3', '#96f0ea', '#b9f5f1', '#dcfaf8' ],
	    ['#98f642', '#90f665', '#b1f494', '#b0f891', '#dbffcc' ],
	    ['#ffa51a', '#ffb748', '#ffc976', '#ffdba3', '#ffedd1' ]
	],
	lightAColor: '#F64272',
	lightBColor: '#51e5db',
	gyroGravityEnabled: device.android,
	physicEnabled: true,
	gravityX: 0,
	gravityY: 0,
	matterObjectsFriction: 0.01,
	matterObjectsRestitution: 0.01,
	matterObjectsFrictionAir: 0.01,
	backgroundEnabled: true,
	backgroundShader: "stars",
	pauseMenuShown: false,
	settingsMenuShown: false,
	shadowsEnabled: false
};

export default state;