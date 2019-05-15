<template>
    <div 
        ref="root"
        class="wonderland root"
        @keydown.right.stop.prevent="engineActive = true"
        @keyup.right.stop.prevent="engineActive = false"
        @keydown.left.stop.prevent="breakActive = true"
        @keyup.left.stop.prevent="breakActive = false"
        tabindex="-1" 
    >

        <canvas
            ref="canvas"
        ></canvas>
        <div
            ref="test"
            class="test"
        ></div>

        <div 
            class="car-control engine"
            v-bind:class="{ active: engineActive }"
            @mousedown="engineActive = true"
            @mouseup="engineActive = false"
            @touchstart="engineActive = true"
            @touchend="engineActive = false"
        >
            <p>Engine</p>
        </div>
        <div 
            class="car-control break"
            v-bind:class="{ active: breakActive }"
            @mousedown="breakActive = true"
            @mouseup="breakActive = false"
            @touchstart="breakActive = true"
            @touchend="breakActive = false"
        >
            <p>Break</p>
        </div>
    </div>
</template>

<script>

import * as THREE from "three"
import { forEach, forEachRight } from "lodash"
import _ from "Helpers"
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
            engineActive: false,
            breakActive: false,
            acceleration: 0,
            currentChunkIndex: 0,
            speedCamera: false
        }
    },
    computed: {
        chunkLength () {
            return this.$store.state.config.chunkSize * this.$store.state.config.curve.pointsStep
        },  
        ...mapState([

        ])
    },
    watch: {
        currentChunkIndex ( value ) {
            this.checkChunks( value )
        },
        engineActive ( value ) {
             console.log(`engine: ${value}`)

             if ( value ) {
                if ( this.__accelerationTween ) {
                    this.__accelerationTween.kill()
                    delete this.__accelerationTween 
                }

                this.__accelerationTween = TweenMax.to( this, this.$store.state.carConfig.accelerationTime, {
                    acceleration: this.$store.state.carConfig.wheelVelocity,
                    ease: "Power3.easeIn",
                    onComplete: ()=>{
                        delete this.__accelerationTween
                    }
                } )

             } else {
                
                if ( this.__decelerationTween ) {
                    this.__decelerationTween.kill()
                    delete this.__decelerationTween 
                }

                this.__decelerationTween = TweenMax.to( this, this.$store.state.carConfig.accelerationTime, {
                    acceleration: 0,
                    ease: "Power3.easeOut",
                    onComplete: ()=>{
                        delete this.__decelerationTween
                    }
                } )
             }

        },
        breakActive ( value ) {
            console.log(`break: ${value}`)

            if ( value ) {
                if ( this.__decelerationTween ) {
                    this.__decelerationTween.kill()
                    delete this.__decelerationTween 
                }

                this.__decelerationTween = TweenMax.to( this, this.$store.state.carConfig.decelerationTime, {
                    acceleration: -this.$store.state.carConfig.wheelVelocity,
                    ease: "Power3.easeOut",
                    onComplete: ()=>{
                        delete this.__decelerationTween
                    }
                } )
             } else {
                if ( this.__accelerationTween ) {
                    this.__accelerationTween.kill()
                    delete this.__accelerationTween 
                }

                this.__accelerationTween = TweenMax.to( this, this.$store.state.carConfig.decelerationTime, {
                    acceleration: 0,
                    ease: "Power3.easeIn",
                    onComplete: ()=>{
                        delete this.__accelerationTween
                    }
                } )

                
             }
        }
    },
	mounted () {
        window.wonder = this
        this.modules = {
            lights: {

            },
            data: {

            },
            time: new THREE.Vector2( 0, 0 ),
            matter: {},
            chunks: {},
            activeChunks: {

            },
            size: new THREE.Vector2( 1, 1 ),
            car: {
                parts: {}
            }
        }

        this.setupRenderer()
        this.setupMatterEngine()
        this.setupLights()
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

        this.addChunk( 0 )
        this.addChunk( 1 )
        this.addChunk( 2 )
        this.createCar()

        this.startRendering()
    },
    methods: {
        laodTexture ( name ) {
            return new THREE.TextureLoader().load( `res/pics/${name}` );
        },
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

            camera.position.z = -500
            camera.rotation.z = Math.PI
            camera.rotation.y = Math.PI

            TweenMax.to( camera.position, 3, {
                z: this.$store.state.config.cameraPosition,
            } )

            let lightGroup = new THREE.Group()

            let pointLight = new THREE.PointLight( 0xffffff, 1, 100000 );
            pointLight.intensity = 1.2;
            pointLight.position.y = 0

            lightGroup.add( pointLight )

            scene.add(lightGroup)

            renderer.setClearColor(0xa4e1ff)            

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


            // add all of the bodies to the world
            // run the engine
            modules.matter.engine = engine
            
            // modules.matter.engine.world.gravity.x = this.$store.state.gravityX
            modules.matter.engine.world.gravity.y = this.$store.state.config.gravityY 
            // modules.matter.render = render
            

            // run the renderer
            if ( this.$store.state.wonderMatterTestRenderer ) {
                let boundsConfig = this.$store.state.wonderMatterTestRendererBounds

                let minx = boundsConfig.x
                let miny = boundsConfig.y
                let maxy = boundsConfig.y + boundsConfig.height
                let maxx = boundsConfig.x + boundsConfig.width

                let render = Matter.Render.create({
                    element: this.$refs.test,
                    engine: engine,
                    bounds: {
                        min: {
                            x: minx,
                            y: miny
                        },
                        max: {
                            x: maxx,
                            y: maxy
                        }
                    }
                });

                Matter.Render.run(render)

                modules.matter.render = render
            }


            // run the renderer
        },
        setupLights () {
            let modules = this.modules

            let sun = new THREE.PointLight( _.cssHex2Hex( this.$store.state.config.sunColor ), 1, 1000000 )

            modules.scene.add( sun )

            modules.lights.sun = sun



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
        updateThings (delta) {
            let modules = this.modules

            let cameraOffset = this.$store.state.config.cameraOffset
            modules.camera.position.y =  modules.car.parts.wheelA.mesh.position.y + cameraOffset.y
            modules.camera.position.x =  modules.car.parts.wheelA.mesh.position.x + cameraOffset.x

            modules.lights.sun.position.set( modules.camera.position.x,  modules.camera.position.y, modules.camera.position.z )

            if ( this.speedCamera ) {
                console.log(1)
                modules.camera.position.z = _.smoothstep(
                    this.$store.state.config.cameraPosition,
                    this.$store.state.config.cameraSpeedPosition,
                    Math.abs( this.acceleration ) / this.$store.state.carConfig.wheelVelocity
                )
            }

            /* engine/break */

            if ( this.acceleration ) {
                Matter.Body.setAngularVelocity( this.modules.car.parts.wheelA.matterBody, this.acceleration )
            }
            // Matter.Body.setAngularVelocity( 
            //     this.modules.car.parts.corpse.matterBody, 
            //     -(this.acceleration * this.$store.state.carConfig.corpseSpeed )
            // )

            /****************/

            if ( !window.kek ) {
                Matter.Engine.update(modules.matter.engine, delta);

                forEach( modules.car.parts, ( part, name )=>{
                    part.mesh.position.x = part.matterBody.position.x
                    part.mesh.position.y = part.matterBody.position.y
                    part.mesh.rotation.z = part.matterBody.angle                    
                } )

                // modules.car.body.mesh.position.x = modules.car.body.matterBody.position.x
                // modules.car.body.mesh.position.y = modules.car.body.matterBody.position.y
                // modules.car.body.mesh.rotation.z = modules.car.body.matterBody.angle
            }

            if ( this.modules.car.parts.corpse ) {
                let chunkLength = this.chunkLength

                let currentChunkIndex = _.nearestMult( 
                    this.modules.car.parts.corpse.mesh.position.x, 
                    ( chunkLength ),
                    false,
                    true
                ) / ( chunkLength )

                this.currentChunkIndex = currentChunkIndex

            }





            // console.log( modules.car.parts.wheelA.matterBody.position )
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
                // modules.camera.position.y = 
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

            let carConfig = this.$store.state.carConfig

            console.log( carConfig )

            let spawnX = carConfig.spawnPosition.x
            let spawnY = carConfig.spawnPosition.y

            let composite

            let group = Matter.Body.nextGroup(true)

            forEach( carConfig.bodies, ( bodyConfig, name )=>{
                let geometry
                let material
                let matterBody

                let x = spawnX + (bodyConfig.x || 0)
                let y = spawnY + (bodyConfig.y || 0)

                let zIndex = bodyConfig.zIndex  == "number" ? bodyConfig.zIndex : 0;


                switch ( bodyConfig.geometry ) {
                    case "rectangle":
                        geometry = new THREE.PlaneBufferGeometry( bodyConfig.width, bodyConfig.height, 1 )
                        // geometry.translate( bodyConfig.width/2, 0, 0 )
                        matterBody = Matter.Bodies.rectangle( x, y, bodyConfig.width, bodyConfig.height, {
                            collisionFilter: {
                                group: group
                            },
                            // chamfer: {
                            //     radius: bodyConfig.height * 0.5
                            // },
                        } )

                        // Matter.Body.translate( matterBody, { x: -bodyConfig.width / 2, y: 0 } )
                    break;
                    case "circle":
                        geometry = new THREE.CircleBufferGeometry( bodyConfig.radius, 32 )
                        matterBody = Matter.Bodies.circle( x, y, bodyConfig.radius, {
                            collisionFilter: {
                                group: group
                            },
                        }, 32 )
                    break;
                }

                let color = bodyConfig.color
                let texture

                if ( color ) {
                    color = _.cssHex2Hex( bodyConfig.color )
                }


                if ( bodyConfig.texture ) texture = this.laodTexture( bodyConfig.texture )

                material = new THREE.MeshPhongMaterial( {
                    color,
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                } )

                let mesh = new THREE.Mesh( geometry, material )
                mesh.position.z = zIndex

                matterBody.restitution = typeof bodyConfig.restitution == "number" ? bodyConfig.restitution : 0.01
                matterBody.frictionAir = typeof bodyConfig.frictionAir == "number" ? bodyConfig.frictionAir : 0.001
                matterBody.friction    = typeof bodyConfig.friction == "number" ? bodyConfig.friction : 0.2

                if ( typeof bodyConfig.density == "number" ) {
                    Matter.Body.setDensity( matterBody , bodyConfig.density );
                }

                if ( typeof bodyConfig.mass == "number" ) {
                    Matter.Body.setMass( matterBody , bodyConfig.mass );
                }


                if ( typeof bodyConfig.angle == "number" ) {
                    Matter.Body.setAngle( matterBody , bodyConfig.angle );
                }


                modules.car.parts[ name ] = {
                    mesh,
                    matterBody
                }

                modules.scene.add( mesh )

                if ( !carConfig.composite ) {
                    Matter.World.add(modules.matter.engine.world, [ matterBody ]);
                }

            } )


            if ( carConfig.composite ) {

                composite = Matter.Composite.create( {} )

                forEach( carConfig.bodies, ( bodyConfig, name )=>{
                    let bodyA = modules.car.parts[ name ].matterBody

                    Matter.Composite.add( composite, [ bodyA ] )

                    if ( bodyConfig.constraint ) {
                        let constraint = bodyConfig.constraint
                        let bodyA = modules.car.parts[ name ].matterBody
                        let bodyB = modules.car.parts[ constraint.body ] ? modules.car.parts[ constraint.body ].matterBody : undefined

                        console.log(bodyA, bodyB)
                        console.log(constraint.point.x)

                        Matter.Composite.add( composite, Matter.Constraint.create( {
                            bodyA,
                            bodyB,
                            pointB: { x: constraint.point.x, y: constraint.point.y },
                            stiffness: typeof constraint.stiffness == "number" ? constraint.stiffness : 1,
                            length: typeof constraint.length == "number" ? constraint.length : 1
                        } ) )

                    }
                } )


                modules.car.composite = composite
                Matter.World.add(modules.matter.engine.world, [ composite ]);
            }
        },
        generatePoints ( chunkIndex ) {

            let count = this.$store.state.config.chunkSize
            let start = chunkIndex * count

            let points = []
            let index = 0
            let step = this.$store.state.config.curve.pointsStep

            for( var a = start; a <= start + count; a++ ) {
                index = points.length
                points.push( {
                    x: a * step,
                    y: 0
                    // index: a
                } )


                forEach( this.$store.state.config.curve.sinMap, ( tuple )=>{
                    points[ index ].y += Math.sin( a / tuple[ 0 ] ) * tuple[ 1 ]
                } )
            }

            return points
        },
        checkChunks () {
            let currentChunkIndex = this.currentChunkIndex
            let modules = this.modules

            let prevChunkIndex = currentChunkIndex - 1
            let nextChunkIndex = currentChunkIndex + 1

            this.addChunk( currentChunkIndex )
            this.addChunk( prevChunkIndex )
            this.addChunk( nextChunkIndex )

            forEach ( this.modules.activeChunks, ( active, chunkIndex )=>{
                if ( active ) {
                    if ( (chunkIndex != currentChunkIndex) && (chunkIndex != prevChunkIndex) && (chunkIndex != nextChunkIndex) ) {
                        this.hideChunk( chunkIndex )
                    }
                }
            } )

        },
        hideChunk ( chunkIndex ) {
            if ( !this.modules.activeChunks[ chunkIndex ] ) {
                return
            } else {
                this.modules.activeChunks[ chunkIndex ] = false 
                this.modules.scene.remove( this.modules.chunks[ chunkIndex ].mesh )

            }
            
        },
        showChunk ( chunkIndex ) {
            if ( this.modules.activeChunks[ chunkIndex ] ) {
                return
            } else {
                this.modules.activeChunks[ chunkIndex ] = true 
                this.modules.scene.add( this.modules.chunks[ chunkIndex ].mesh )
            }
        },
        addChunk ( chunkIndex ) {
            if ( this.modules.chunks[ chunkIndex ] ) {
                this.showChunk( chunkIndex )
                return
            }

            let points = this.generatePoints( chunkIndex )
            let modules = this.modules

            let geometry = this.generatePathGeometry( points )
            let material = this.modules.data.groundMaterial || new THREE.MeshPhongMaterial( {
                side: THREE.DoubleSide,
                color: _.cssHex2Hex( this.$store.state.config.groundColor ),
                map: this.laodTexture( this.$store.state.config.groundTexture ),
                transparent: true
            } )

            if ( this.$store.state.config.groundBumpMap ) {
                material.bumpMap = this.laodTexture( this.$store.state.config.groundBumpMap )
                material.bumpMap.flipY = false
                material.bumpMap.needsUpdate = true

                if ( this.$store.state.config.groundBumpMapScale  ) {
                    material.bumpScale = this.$store.state.config.groundBumpMapScale
                }

            }

            material.map.flipY = false
            material.map.needsUpdate = true

            this.modules.data.groundMaterial = material

            let mesh = new THREE.Mesh( geometry, material )
            this.modules.scene.add( mesh )

            let matterBody = this.generateCurveMatterBody( points )
            matterBody.friction = this.$store.state.config.groundFriction
            Matter.World.add(modules.matter.engine.world, [ matterBody ]);

            this.modules.chunks[ chunkIndex ] = {
                mesh,
                matterBody
            }

            this.modules.activeChunks[ chunkIndex ] = true

        },
        generatePathGeometry ( points ) {
            // console.log(points)
            let bufferGeometry = new THREE.BufferGeometry()

            bufferGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array( points.length * 18 ), 3));
            bufferGeometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array( points.length * 18 ), 3));
            bufferGeometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array( points.length * 12 ), 2));

            let position = 0
            let groundTextureSize = this.$store.state.config.groundTextureSize
            let pointsStep = this.$store.state.config.curve.pointsStep
            let groundTextureUVYScale = this.$store.state.config.groundTextureUVYScale

            forEach( points, ( point, index )=>{
                let nextPoint = points[ index + 1 ]

                if ( !nextPoint ) {

                } else {

                    let scaleGroundTextureSize = groundTextureSize * pointsStep
// 
                    let chunkLength = this.chunkLength
                    let uvx = ( ( point.x ) % ( scaleGroundTextureSize ) ) / (  scaleGroundTextureSize  )
                    let uvxNext = ( (nextPoint.x ) % ( scaleGroundTextureSize ) ) / (  scaleGroundTextureSize  )
                    let uvy = groundTextureUVYScale

                    if ( uvxNext < uvx ) {
                        uvxNext = 1
                    }

                    bufferGeometry.attributes.uv.setXY( position, uvx, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, point.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvxNext, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvx, uvy )
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, this.$store.state.config.groundHeight, 0 )



                    bufferGeometry.attributes.uv.setXY( position, uvxNext, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvxNext, uvy)
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, this.$store.state.config.groundHeight, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvx, uvy)
                    bufferGeometry.attributes.normal.setXYZ( position, 1, 1, 0 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, this.$store.state.config.groundHeight, 0 )

                }

            } )

            bufferGeometry.needsUpdate = true
            bufferGeometry.attributes.position.needsUpdate = true
            bufferGeometry.attributes.uv.needsUpdate = true

            return bufferGeometry
        },
        generateCurveMatterBody ( points ) {
            // console.log( points )

            let matterPoints = points.slice()

            let lastPoint = points[ points.length - 1 ]
            let firstPoint = points[ 0 ]

            forEachRight( points, ( point )=>{
                matterPoints.push( {
                    x: point.x,
                    y: this.$store.state.config.groundHeight
                } )
            } )

            // points.push( {
            //     x: lastPoint.x,
            //     y: this.$store.state.config.groundHeight,
            // } )

            // points.push( {
            //     x: firstPoint.x,
            //     y: this.$store.state.config.groundHeight
            // } )

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

            // console.log( points )

            let body = Matter.Bodies.fromVertices( 0, 0, matterPoints, {
                isStatic: true
            } )

            // console.log( ( body.bounds.max.y - body.bounds.min.y ) )


            Matter.Body.translate( body, { x: firstPoint.x - ( body.bounds.min.x ), y: ( this.$store.state.config.groundHeight - body.bounds.max.y ) } )
            console.log( body.bounds.min, body.bounds.max )

            body.restitution = 0

            console.log(body)

            // body.static = true

            return body
        }
    }

}
   
</script>

<style lang="sass">
    import "sass/wonderland.scss"
</style>