<template>
    <div 
        ref="root"
        class="wonderland root"
    >

        <canvas
            ref="canvas"
        ></canvas>
        <div
            ref="test"
            class="test"
        ></div>
    </div>
</template>

<script>

import * as THREE from "three"
import { forEach } from "lodash"
import Hamer from "hammerjs"
import { TweenMax } from "gsap/TweenMax"
import SoundBlaster from "components/Wonderland/SoundBlaster"
import { mapState } from 'vuex';

import decomp from 'poly-decomp'
window.decomp = decomp

const Matter = window.Matter = require("matter-js")

export default {
    data () {
        return {
            prevRenderedFrameTime: +new Date(),
        }
    },
    computed: mapState([

    ]),
    watch: {},
	mounted () {
        window.wonder = this
        this.modules = {
            time: new THREE.Vector2( 0, 0 ),
            matter: {},
            chunks: [],
            size: new THREE.Vector2( 1, 1 ),
            car: {}
        }

        let points = this.generatePoints(100)

        this.setupRenderer()
        this.setupMatterEngine()
        this.updateSize()

        window.addEventListener( "resize", ()=>{
            this.updateSize()
        } )

        

        /**/
        // let geometry = new THREE.PlaneBufferGeometry( 200, 200, 200 )
        // let material = new THREE.MeshBasicMaterial( {
        //     color: 0xFF0000,
        //     side: THREE.DoubleSide,
        //     transparent: true
        // } )

        // let mesh = new THREE.Mesh( geometry, material )
        // this.modules.scene.add( mesh )
        /**/

        this.addChunk( points )
        this.createCar()

        this.startRendering()
    },
    methods: {
        setupGestures () {
            // Create an instance of Hammer with the reference.
            var manager = new Hammer.Manager( this.$refs.root );

            // Create a recognizer
            var Swipe = new Hammer.Swipe();

            // Add the recognizer to the manager
            manager.add(Swipe);

            // Declare global variables to swiped correct distance
            var deltaX = 0;
            var deltaY = 0;

            // Subscribe to a desired event
            manager.on('swipe', (e)=>{
                this.$store.dispatch( "checkFullscreen" )

                if ( !this.mainThemePlays && !this.$store.state.isHybridApp ) {
                    this.$store.state.mainThemePlays = true
                }

                e.preventDefault()
                this.setVelocity( e.overallVelocityX * config.velocityMultiplier * window.devicePixelRatio, e.overallVelocityY * config.velocityMultiplier * window.devicePixelRatio )
            });

        },
        setupGyro () {
            window.addEventListener('deviceorientation', ( event )=> {
               if ( !modules.matter.engine ) return

               if ( this.gyroGravityEnabled ) {
                   let alpha = Math.floor(event.alpha)
                   let beta  = Math.floor(event.beta)
                   let gamma = Math.floor(event.gamma)

                   let newGravityX = gamma * config.gravityMultiplier
                   let newGravityY = beta * config.gravityMultiplier

                   // console.log(alpha, beta, gamma)

                   modules.gyro.set( newGravityX, newGravityY  )

                   if (newGravityX == 0 && newGravityY == 0) {
                       return
                   }

                   if (newGravityX > 1) newGravityX = 1
                   if (newGravityY > 1) newGravityY = 1

                   if (newGravityX < -1) newGravityX = -1
                   if (newGravityY < -1) newGravityY = -1

                   modules.matter.engine.world.gravity.x = (newGravityX)
                   modules.matter.engine.world.gravity.y = (newGravityY)
                   // this.$store.state.gravityX = (newGravityX)
                   // this.$store.state.gravityY = (newGravityY)



                   this.$refs.gravityX.textContent = newGravityX.toFixed(2)
                   this.$refs.gravityY.textContent = newGravityY.toFixed(2)
               }


            });

            // window.addEventListener('devicemotion', ( event )=> {
            //     let ax = Math.floor( event.acceleration.x )
            //     let ay = Math.floor( event.acceleration.y )

            //     this.setVelocity(ax, ay)


            // });

            // window.addEventListener('compassneedscalibration', function(event) {
            // });
        },  
        setupRenderer () {
            let canvasElement = this.$refs.canvas


            let scene = new THREE.Scene()
            let camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.001, 100000 )
            let renderer = new THREE.WebGLRenderer({ 
                antialias: false, 
                canvas: canvasElement,
            })

            camera.position.z = 100

            let lightGroup = new THREE.Group()

            let pointLight = new THREE.PointLight( 0xffffff, 1, 100000 );
            pointLight.intensity = 1.2;
            pointLight.position.y = 0

            lightGroup.add( pointLight )

            scene.add(lightGroup)

            renderer.setClearColor(0x000000)            

            this.modules.scene = scene
            this.modules.camera = camera
            this.modules.renderer = renderer
            this.modules.lightGroup = lightGroup
            this.modules.pointLight = pointLight

            setInterval( ()=>{
                this.modules.time.x += 0.01
                this.modules.time.x = this.modules.time.x % 10
            }, 1000 / 30 )
        },
        setupMatterEngine () {
            let modules = this.modules


            // create an engine
            var engine = Matter.Engine.create();


            var render = Matter.Render.create({
                element: this.$refs.test,
                engine: engine
            });

            // add all of the bodies to the world
            // run the engine
            modules.matter.engine = engine
            // modules.matter.engine.world.gravity.x = this.$store.state.gravityX
            // modules.matter.engine.world.gravity.y = this.$store.state.gravityY
            // modules.matter.render = render
            Matter.Engine.run(engine);

            // run the renderer
            Matter.Render.run(render)

            // run the renderer
        },
        startRendering () {
            this.prevRenderedFrameTime = +new Date()
            this.renderingActive = true
            // modules.matter.runner = Engine.run(modules.matter.engine);
            this.render()
        },
        render () {
            let modules = this.modules
            let now = +new Date()
            let delta = now - this.prevRenderedFrameTime

            if ( delta > 100 ) delta = 100

            this.prevRenderedFrameTime = now

            this.rafId = requestAnimationFrame( ()=> this.render() )

            this.updateThings( delta || 0 )
            this.renderFrame( delta )

           

        },
        updateThings () {
            let modules = this.modules

            modules.car.wheelA.mesh.position.x = modules.car.wheelA.matterBody.position.x
            modules.car.wheelA.mesh.position.y = -modules.car.wheelA.matterBody.position.y
            modules.car.wheelA.mesh.rotation.z = -modules.car.wheelA.matterBody.angle

            // console.log( modules.car.wheelA.matterBody.position )
        },
        renderFrame ( ) {
            this.modules.renderer.render( this.modules.scene, this.modules.camera )
        },
        stopRendering () {
            this.renderingActive = false
            // Matter.Runner.stop( modules.matter.runner )
            cancelAnimationFrame( this.rafId )
        },
        updateSize () {
            let modules = this.modules

            let canvasElement = this.$refs.canvas
            let canvasParentElement = canvasElement.parentElement

            if ( canvasParentElement ) {
                let rect = canvasParentElement.getBoundingClientRect()

                let width = rect.width * window.devicePixelRatio
                let height = rect.height * window.devicePixelRatio

                modules.camera.aspect = width/ height
                // modules.camera.position.x = modules.lightGroup.position.x = width / 2
                // modules.camera.position.y = modules.lightGroup.position.y = -height / 2
                // modules.camera.position.z = modules.lightGroup.position.z = ( ( Math.sqrt( 3 ) / 2 ) * height )

                // modules.lightGroup.position.z

                modules.pointLight.position.y = -height / 2

                modules.size.x = width
                modules.size.y = height

                modules.camera.updateProjectionMatrix()
                modules.renderer.setSize( width, height )
            }
        },

        createCar () {
            let modules = this.modules

            let geometry = new THREE.CircleBufferGeometry( 10, 32 )
            let material = new THREE.MeshBasicMaterial( {
                color: 0xF3F404
            } )

            let mesh = new THREE.Mesh( geometry, material )

            modules.scene.add( mesh )

            let matterBody = Matter.Bodies.circle( 20, 0, 10 )

            Matter.World.add(modules.matter.engine.world, [ matterBody ]);

            modules.car.wheelA = {
                mesh,
                matterBody
            }

        },

        generatePoints ( count ) {
            let result = []

            for( var a = 0; a < count; a++ ) {
                result.push( {
                    x: a,
                    y: Math.random()
                    // index: a
                } )
            }

            return result
        },
        addChunk ( points ) {
            let modules = this.modules

            let geometry = this.generatePathGeometry( points )
            let material = new THREE.MeshBasicMaterial( {
                side: THREE.DoubleSide,
                color: 0xFF00ff
            } )

            let mesh = new THREE.Mesh( geometry, material )
            // mesh.geometry.translate( 0.5, -200, 0 )

            // let pivot = new THREE.Object3D()
            // pivot.add( mesh )

            this.modules.scene.add( mesh )

            mesh.frustumCulled = false

            console.log(geometry)

            let matterBody = this.generateCurveMatterBody( points )

            Matter.World.add(modules.matter.engine.world, [ matterBody ]);

            this.modules.chunks.push( {
                mesh,
                matterBody
            } )


            console.log( matterBody )
        },
        generatePathGeometry ( points ) {
            let bufferGeometry = new THREE.BufferGeometry()

            bufferGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array( points.length * 10  ), 3));

            let position = 0
            forEach( points, ( point, index )=>{
                let nextPoint = points[ index + 1 ]

                if ( !nextPoint ) {

                } else {

                    bufferGeometry.attributes.position.setXYZ( position++, point.x, point.y, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, -200, 0 )

                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, -200, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, -200, 0 )

                }

            } )

            bufferGeometry.needsUpdate = true
            bufferGeometry.attributes.position.needsUpdate = true

            return bufferGeometry
        },
        generateCurveMatterBody ( points ) {
            console.log( points )

            points = points.slice()

            let lastPoint = points[ points.length - 1 ]
            let firstPoint = points[ 0 ]

            points.push( {
                x: lastPoint.x,
                y: 200,
            } )

            points.push( {
                x: firstPoint.x,
                y: 200
            } )

            points.push( {
                x: firstPoint.x,
                y: firstPoint.y
            } )

            // points = [
            //     { x: 0, y: 0 },
            //     { x: 0, y: 100 },
            //     { x: 50, y: 50 },
            //     { x: 100, y: 100 },
            //     { x: 100, y: 0 }
            // ]

            console.log( points )

            let body = Matter.Bodies.fromVertices( lastPoint.x / 2, 200, points, {
                isStatic: true
            } )

            console.log(body)

            // body.static = true

            return body
        }
    }

}
   
</script>

<style lang="sass">

</style>