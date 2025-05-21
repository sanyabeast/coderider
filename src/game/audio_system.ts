import { Howl, Howler } from 'howler';

const soundsContext = require.context("audio")

class SoundBlaster {
	Howler: Howler;
	sounds: {
		[x: string]: Howl
	};
	constructor() {
		this.sounds = {}
		this.Howler = Howler

		soundsContext.keys().forEach((path, index) => {
			if (path.indexOf("mp3") > -1) {
				return
			}

			let name = path.split("/")[1].split(".")[0]

			let sound = new Howl({
				src: [`res/audio/${name}.ogg`, `res/audio/${name}.mp3`],
				autoplay: false,
				html5: false
			});

			this.sounds[name] = sound
		})

	}

	play(name: string, volume: number = 0.333, loop: boolean = false) {
		this.sounds[name].volume(volume)
		this.sounds[name].loop(loop)
		this.sounds[name].play()
	}

	stop(name: string) {
		this.sounds[name].stop()
	}

	mute(muted: boolean = true) {
		this.Howler.mute(muted)
	}
}

export default SoundBlaster