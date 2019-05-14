import { Howl, Howler } from 'howler';

const soundsContext = require.context( "sounds" )

class SoundBlaster {
	constructor () {
		this.sounds = {}
		this.Howler = Howler

		soundsContext.keys().forEach( ( path, index )=>{
			let name = path.split( "/" )[1].split( "." )[0]

			let sound = new Howl({
			  	src: [ `res/sounds/${name}.ogg` ],
			  	autoplay: false,
			    // loop: true,
			    html5: true
			});

			this.sounds[ name ] = sound
		} )
	}


	play ( name, volume, loop ) {
		this.sounds[ name ].volume( volume || 0.333 )
		this.sounds[ name ].loop( loop || false )
		this.sounds[ name ].play()
	} 

	stop ( name ) {
		this.sounds[ name ].stop()
	}	 	

	mute ( muted ) {
		this.Howler.mute( muted )
	}
}

export default SoundBlaster