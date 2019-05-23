<template>
	<svg
		x="50%"
		y="80%"
		width="200"
		height="100"
		style="overflow: visible;"
	>
		<circle 
			cx=0
			cy=0
			r="40" 
			stroke="#ffffff" 
			stroke-width="2" 
			fill="transparent"
		/>
		<rect
			width="30"
			height="2"
			x="0"
			y="0"
			transform="rotate(0 0 -225)"
			fill="#ffffff"
			stroke="transparent"
			ref="rect"
		/>
	</svg>
</template>
<script type="text/javascript">
	
	import Helpers from "Helpers"

	window.helpers = Helpers

	export default {
		props: {
			speedRange: {
				type: Array,
				default: ()=> [0, 100]
			}
		},
		methods: {
			setSpeed ( speed ) {
				let step = Helpers.getStep( this.speedRange[ 0 ], this.speedRange[ 1 ], speed )
				let rotation = Helpers.smoothstep( -222, 45, step )

				console.log( rotation )

				if ( rotation < 0 ) rotation = 0
				if ( rotation > 1 ) rotation = 1


				this.$refs.rect.setAttribute( "transform", `rotate(0 0 ${ Math.floor( rotation ) })` )

			}
		}
	}
</script>