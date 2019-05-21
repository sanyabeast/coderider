
class Benchmark {
	constructor () {
		let width = window.innerWidth
		let height = window.innerHeight
		let DPR = window.devicePixelRatio

		let canvas = document.createElement( "canvas" )

		canvas.width = width * DPR
		canvas.height = height * DPR

		canvas.style.position = "absolute"
		canvas.style.left = "0"
		canvas.style.top = "0"
		canvas.style.zIndex = -1

		let context = canvas.getContext( "2d" )

		context.lineJoin = "round"
		context.lineCap = "round"

		this.canvas = canvas
		this.context = context
		this.width = width
		this.height = height
		this.DPR = DPR
	}

	run () {
		let canvas = this.canvas
		let context = this.context
		let width = this.width
		let height = this.height
		let DPR = this.DPR

		document.body.appendChild( canvas )

		let stroke2d = this.test( ()=>{
			context.beginPath()
			context.lineWidth = Math.random() * 10
			context.strokeStyle = `#${( Math.floor( Math.random() * 16777215 ) ).toString( 16 )}`
			context.moveTo( Math.random() * ( width * DPR ), Math.random() * ( height * DPR ) )
			context.lineTo( Math.random() * ( width * DPR ), Math.random() * ( height * DPR ) )
			context.stroke()
		}, 8000 )

		document.body.removeChild( canvas )


		let math = this.test( ()=>{
			return Math.max( 
				Math.sqrt(Math.pow(Math.random(), 3) + Math.pow(Math.random(), 3)), 
				Math.sqrt(Math.pow(Math.random(), 3) + Math.pow(Math.random(), 3)), 
				Math.sqrt(Math.pow(Math.random(), 3) + Math.pow(Math.random(), 3)),
				Math.sqrt(Math.pow(Math.random(), 3) + Math.pow(Math.random(), 3)),
			)
		}, 160000 )


		let json_data = '{ "glossary": { "title": "example glossary", "GlossDiv": { "title": "S", "GlossList": { "GlossEntry": { "ID": "SGML", "SortAs": "SGML", "GlossTerm": "Standard Generalized Markup Language", "Acronym": "SGML", "Abbrev": "ISO 8879:1986", "GlossDef": { "para": "A meta-markup language, used to create markup languages such as DocBook.", "GlossSeeAlso": ["GML", "XML"] }, "GlossSee": "markup" } } } } }'
		let json = this.test( ()=>{
			JSON.parse( json_data )
		}, 60000 )

		let resolution = ( Math.pow( ( width * height * DPR ) / ( 1280 * 720 ), 1 ) ) * 300

		let result = {
			index: Number( ( 1 / ( ( stroke2d + math + json + resolution ) / 1200 ) ).toFixed( 2 ) ),
			tests: {
				stroke2d,
				math,
				json,
				resolution
			}
		}

		console.info( "benchmark results:", result )

		return result
	}

	test ( callback, iterations ) {
		let start_time = +new Date()
		
		for ( let a = 0; a < iterations; a++ ) {
			callback()
		}

		let end_time = +new Date()
		let duration = end_time - start_time

		return duration

	}  
}

export default Benchmark