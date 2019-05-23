import { Howl, Howler } from 'howler';
import { forEach } from "lodash"

const soundsContext = require.context( "sounds" )

class SoundBlaster {
	constructor () {
		this.sounds = {}
		this.Howler = Howler

		soundsContext.keys().forEach( ( path, index )=>{
			if ( path.indexOf( "mp3" ) > -1 ) {
				return 
			}

			let name = path.split( "/" )[1].split( "." )[0]

			let sound = new Howl({
			  	src: [ `res/sounds/${name}.ogg`, `res/sounds/${name}.mp3` ],
			  	autoplay: false,
			    // loop: true,
			    html5: true
			});

			this.sounds[ name ] = sound
		} )

		// let firstPlay = false
		// window.addEventListener( "click", ()=>{
		// 	// alert("kek")
		// 	if ( !firstPlay ) {
		// 		firstPlay = true
				
		// 		forEach( this.sounds, ( sound )=>{
		// 			sound.play()
		// 			setTimeout( ()=>{
		// 				sound.stop()
		// 			}, 5000 )
		// 		} )


		// 	}
		// } )
		
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