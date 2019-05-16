<template>
    <div 
        ref="root"
        class="wonderland root"
        @click="onRootClick"
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

        <!-- <div class="daynight">
            <div 
                class="token material-icons"
                v-bind:style="{ left: `${(this.hour / this.hoursCount * 100)}%` }"
            >
                access_time
            </div>
        </div> -->

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
const DPR = window.devicePixelRatio

export default {
    data () {
        return {
            prevRenderedFrameTime: +new Date(),
            engineActive: false,
            breakActive: false,
            acceleration: 0,
            currentChunkIndex: 0,
            lightsZ: 1,
            hour: 0,
            sunOffset: { x: 0, y: 0, z: 0 },
            hoursCount: 0
        }
    },
    computed: {
        chunkLength () {
            return this.$store.state.config.chunkSize * this.$store.state.config.curve.pointsStep
        },  
        ...mapState([
            "bumpmappingEnabled",
            "daynight",
            "saveChunks",
            "gravityX",
            "gravityY",
            "speedCamera",
            "freeCamera",
            "freeCameraZ",
            "physicsEnabled",
            "bumpmapMultiplier",
            "paused",
            "mainThemePlays",
            "soundMuted"
        ])
    },
    watch: {
        mainThemePlays ( plays ) {
            if ( plays ) {
                this.modules.soundBlaster.play( "main_theme", 0.333, true )
            } else {
                this.modules.soundBlaster.stop( "main_theme" )
            }
        },
        soundMuted ( muted ) {
            this.modules.soundBlaster.mute( muted )
            this.$store.dispatch( "save" )
        },
        paused ( value ) {
            if ( value ) {
                TweenMax.pauseAll( TweenMax.getAllTweens() )
            } else {
                TweenMax.resumeAll( TweenMax.getAllTweens() )
            }
        },
        bumpmapMultiplier ( value ) {
            this.renderFrame()
        },
        bumpmappingEnabled ( value ) {
            this.$bumpmappingEnabled = value
            this.renderFrame()
        },
        freeCameraZ ( value ) {
            this.modules.camera.position.z = -value
            this.renderFrame()
        },
        gravityX ( value ) {
            this.modules.matter.engine.world.gravity.x = value
        },
        gravityY ( value ) {
            this.modules.matter.engine.world.gravity.y = value
        },
        currentChunkIndex ( value ) {
            this.checkChunks( value )
        },
        engineActive ( value ) {

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
                
                if ( this.__accelerationTween ) {
                    this.__accelerationTween.kill()
                    delete this.__accelerationTween 
                }

                this.__accelerationTween = TweenMax.to( this, this.$store.state.carConfig.accelerationTime, {
                    acceleration: 0,
                    ease: "Power3.easeOut",
                    onComplete: ()=>{
                        delete this.__accelerationTween
                    }
                } )
             }

        },
        breakActive ( value ) {

            if ( value ) {
                if ( this.__accelerationTween ) {
                    this.__accelerationTween.kill()
                    delete this.__accelerationTween 
                }

                this.__accelerationTween = TweenMax.to( this, this.$store.state.carConfig.decelerationTime, {
                    acceleration: -this.$store.state.carConfig.wheelVelocity / 2,
                    ease: "Power3.easeOut",
                    onComplete: ()=>{
                        delete this.__accelerationTween
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

        this.$bumpmappingEnabled = true

        this.modules = {
            soundBlaster: new SoundBlaster(),
            objects: {

            },
            lights: {

            },
            data: {
                textures: {}
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

        if ( this.$store.state.isAndroid ) {
            this.lightsZ = -1
        }

        this.setupRenderer()
        this.setupBackground()
        this.setupMatterEngine()
        this.setupLights()
        this.updateSize()

        window.addEventListener( "resize", ()=>{
            this.updateSize()
        } )

        
        this.setupDaynight()

        this.addChunk( -1 )
        this.addChunk( 0 )
        this.addChunk( 1 )
        this.createCar()

        this.createObject("moto", wonder.$store.state.objects.moto, 541, 440)
        // this.createObject("truck", wonder.$store.state.objects.truck, 900, 400)
        // this.createObject("can1", wonder.$store.state.objects.can, 300, -250)
        // this.createObject("can2", wonder.$store.state.objects.can, 300, -250)
        // this.createObject("can3", wonder.$store.state.objects.can, 300, -250)

        this.startRendering()

        if ( this.$store.state.isHybridApp ) {
            this.$store.state.mainThemePlays = true
        }

        this.modules.soundBlaster.mute( this.$store.state.soundMuted )
    },
    methods: {
        onRootClick () {
            if ( !this.mainThemePlays && !this.$store.state.isHybridApp ) {
                this.$store.state.mainThemePlays = true
            }
        },
        laodTexture ( name ) {
            let texture = this.modules.data.textures[ name ]

            if ( !texture ) {
                this.modules.data.textures[ name ] = texture = new THREE.TextureLoader().load( `res/pics/${name}` );
            }

            return texture
        },
        setupDaynight () {
            
            this.hoursCount = this.$store.state.daynight.length

            this.setDaytime( this.hour, true )

            this.daynightInterval = setInterval( ()=>{
                this.hour++
                this.hour = this.hour % this.$store.state.daynight.length
                this.setDaytime( this.hour )
            }, this.$store.state.config.daynightHourDuration * 1000 )



        },
        setDaytime ( hour, immediately ) {
            let modules = this.modules
            let hourData = this.$store.state.daynight[ hour ]
            let sun = this.modules.lights.sun
            let duration = this.$store.state.config.daynightHourDuration / 2
            let sunColor = new THREE.Color()
            sunColor.setHex( _.cssHex2Hex( hourData.sunColor ) )
            let skyColor = new THREE.Color()
            skyColor.setHex( _.cssHex2Hex( hourData.skyColor ) )


            if ( immediately ) {
                sun.intensity = hourData.intensity

                this.sunOffset.x = hourData.sunOffset.x
                this.sunOffset.y = hourData.sunOffset.y
                this.sunOffset.z = hourData.sunOffset.z

                sun.color.r = sunColor.r
                sun.color.g = sunColor.g
                sun.color.b = sunColor.b

                modules.bg.material.uniforms.diffuse.value.r = skyColor.r
                modules.bg.material.uniforms.diffuse.value.g = skyColor.g
                modules.bg.material.uniforms.diffuse.value.b = skyColor.b


            } else {
                TweenMax.to( sun, duration, {
                    intensity: hourData.intensity,
                    ease: "linear"
                } )

                TweenMax.to( this.sunOffset, duration, {
                    x: hourData.sunOffset.x,
                    y: hourData.sunOffset.y,
                    z: hourData.sunOffset.z,
                    ease: "linear"
                } )

                TweenMax.to( sun.color, duration, {
                    r: sunColor.r,
                    g: sunColor.g,
                    b: sunColor.b,
                    ease: "linear"
                } )


                TweenMax.to( modules.bg.material.uniforms.diffuse.value, duration, {
                    r: skyColor.r,
                    g: skyColor.g,
                    b: skyColor.b,
                    ease: "linear"
                } )
            }

        },
        respawn () {
            let car = this.modules.objects.car
            Matter.Body.setAngle( car.parts.corpse.matterBody, 0 )
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

            TweenMax.fromTo( camera.rotation, 4, {
                z: Math.PI + (-Math.PI / 257)
            }, {
                z: Math.PI + (Math.PI / 257),
                repeat: -1,
                yoyo: true,
                ease: "Power1.easeInOut"
            } )

            let lightGroup = new THREE.Group()

            let pointLight = new THREE.PointLight( 0xffffff, 1, 100000 );
            pointLight.intensity = 1.2;
            pointLight.position.y = 0

            lightGroup.add( pointLight )

            // scene.add(lightGroup)

            renderer.setClearColor(0xfff17f)            

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
            var engine = Matter.Engine.create( {
                positionIterations: 1,
                velocityIterations: 1,
                constraintIterations: 1,
                enableSleeping: false,
            } );


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
                    },
                    // wireframes: true
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
        setupBackground () {
            let self = this

            let modules = this.modules

            let vertShader = require( "raw-loader!shaders/bg.vert" ).default
            let fragShader = require( "raw-loader!shaders/stars.frag" ).default
            // let fragShader = require( "raw-loader!shaders/helix.frag" ).default

            let geometry = new THREE.PlaneGeometry( 1, 1, 1)
            // geometry.translate( height / 2, width / 2, 0 )

            let bg = new THREE.Mesh ( geometry, new THREE.ShaderMaterial( {
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    diffuse: {
                        value: new THREE.Color(),
                    }
                },
                side: THREE.DoubleSide,
                transparent: true
            } ) )

            modules.bg = bg

            bg.frustumCulled = false
            bg.position.z = 1000

            modules.scene.add(bg)
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

            if ( delta > 64 ) delta = 64

            this.prevRenderedFrameTime = now

            this.rafId = requestAnimationFrame( ()=> this.render() )

            this.updateThings( delta || 0 )
            this.renderFrame( delta )

           

        },
        updateThings (delta) {
            let modules = this.modules

            let cameraOffset = this.$store.state.config.cameraOffset
            modules.camera.position.y =  modules.objects.car.parts.wheelA.mesh.position.y + cameraOffset.y
            modules.camera.position.x =  modules.objects.car.parts.wheelA.mesh.position.x + cameraOffset.x

            modules.lights.sun.position.set( 
                modules.camera.position.x + this.sunOffset.x,  
                modules.camera.position.y + this.sunOffset.y, 
                (this.lightsZ * modules.camera.position.z * 4 ) * this.sunOffset.z
            )

            if ( this.speedCamera && !this.freeCamera ) {
                modules.camera.position.z = _.smoothstep(
                    this.$store.state.config.cameraPosition,
                    this.$store.state.config.cameraSpeedPosition,
                    Math.abs( this.acceleration ) / this.$store.state.carConfig.wheelVelocity
                )
            }

            /* engine/break */

            if ( this.engineActive || this.breakActive ) {
                // console.log( this.modules.objects.car.parts.wheelA.matterBody.velocity.x.toFixed(2), this.modules.objects.car.parts.wheelA.matterBody.velocity.y.toFixed(2) )
                Matter.Body.setAngularVelocity( this.modules.objects.car.parts.wheelA.matterBody, this.acceleration )
                Matter.Body.setAngularVelocity( this.modules.objects.car.parts.wheelB.matterBody, this.acceleration )
                // Matter.Body.applyForce( this.modules.objects.car.parts.wheelA.matterBody, {
                //     x: this.modules.objects.car.parts.wheelA.matterBody.position.x,
                //     y: this.modules.objects.car.parts.wheelA.matterBody.position.y
                // }, {
                //     x: this.acceleration / 10000,
                //     y: 0
                // } )
            }

            Matter.Body.setAngularVelocity( this.modules.objects.moto.parts.wheelB.matterBody, this.acceleration )
            /****************/

            if ( this.physicsEnabled ) {
                Matter.Engine.update(modules.matter.engine, delta);
            }

            forEach( modules.objects, ( object, name )=>{
                forEach( object.parts, ( part, name )=>{
                    part.mesh.position.x = part.matterBody.position.x
                    part.mesh.position.y = part.matterBody.position.y
                    part.mesh.rotation.z = part.matterBody.angle                    
                } )
            } )

            if ( this.modules.objects.car.parts.corpse ) {
                let chunkLength = this.chunkLength

                let currentChunkIndex = _.nearestMult( 
                    this.modules.objects.car.parts.corpse.mesh.position.x, 
                    ( chunkLength ),
                    false,
                    true
                ) / ( chunkLength )

                this.currentChunkIndex = currentChunkIndex

            }





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
            this.createObject( "car", this.$store.state.carConfig )
        },
        createObject ( objectName, config, spawnX, spawnY) {
            let modules = this.modules

            if ( typeof spawnX != "number" ) {
                spawnX = config.spawnPosition.x || 0
            }

            if ( typeof spawnY != "number" ) {
                spawnY = config.spawnPosition.y || 0
            }

            
            

            let composite

            let group = Matter.Body.nextGroup(true)

            forEach( config.bodies, ( bodyConfig, name )=>{
                let geometry
                let material
                let matterBody

                let x = spawnX + (bodyConfig.x || 0)
                let y = spawnY + (bodyConfig.y || 0)

                let zIndex = bodyConfig.zIndex  == "number" ? bodyConfig.zIndex : 0;

                modules.objects[ objectName ] = modules.objects[ objectName ]  || {
                    parts: {}
                }

                switch ( bodyConfig.geometry ) {
                    case "rectangle":
                        geometry = new THREE.PlaneBufferGeometry( bodyConfig.width, bodyConfig.height, 1 )
                        // geometry.translate( bodyConfig.width/2, 0, 0 )
                        matterBody = Matter.Bodies.rectangle( x, y, bodyConfig.width, bodyConfig.height, {
                            collisionFilter: {
                                group: group
                            },
                            chamfer: {
                                radius: bodyConfig.height * 0.2
                            },
                            render: {
                                fillStyle: bodyConfig.color
                            }
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
                    depthTest: true,
                    side: THREE.DoubleSide
                } )

                if ( texture && typeof bodyConfig.textureFlip == "boolean" ) {
                    material.map.flipY = !bodyConfig.textureFlip
                    material.map.needsUpdate = true
                }

                if ( bodyConfig.bumpMap ) {
                    let bumpMap = this.laodTexture( bodyConfig.bumpMap )
                    material.bumpMap = bumpMap

                    _.getter( material, "bumpScale", ()=>{
                        if ( this.$bumpmappingEnabled ) return (material._bumpScale * this.bumpmapMultiplier)
                    }, ( value )=>{
                        material._bumpScale = value
                    } )


                    if ( typeof bodyConfig.bumpScale == "number" ) {
                        material.bumpScale = bodyConfig.bumpScale * DPR
                    }

                    if ( typeof bodyConfig.textureFlip == "boolean" ) {
                        bumpMap.flipY = !bodyConfig.textureFlip
                        bumpMap.needsUpdate = true
                    }
                }

                if ( typeof bodyConfig.opacity == "number" ) {
                    material.opacity = bodyConfig.opacity
                }

                let mesh = new THREE.Mesh( geometry, material )
                mesh.position.z = zIndex

                if ( bodyConfig.scale ) {
                    mesh.scale.x = bodyConfig.scale.x
                    mesh.scale.y = bodyConfig.scale.y
                }

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

                if ( typeof bodyConfig.static == "boolean" ) {
                    Matter.Body.setStatic( matterBody, bodyConfig.static )
                }



                modules.objects[ objectName ].parts[ name ] = {
                    mesh,
                    matterBody
                }

                modules.scene.add( mesh )

                if ( !config.composite ) {
                    Matter.World.add(modules.matter.engine.world, [ matterBody ]);
                }

            } )


            if ( config.composite ) {

                composite = Matter.Composite.create( {} )

                forEach( config.bodies, ( bodyConfig, name )=>{
                    let bodyA = modules.objects[ objectName ].parts[ name ].matterBody

                    Matter.Composite.add( composite, [ bodyA ] )

                    if ( bodyConfig.constraint ) {
                        let constraint = bodyConfig.constraint
                        let bodyA = modules.objects[ objectName ].parts[ name ].matterBody
                        let bodyB = modules.objects[ objectName ].parts[ constraint.body ] ? modules.objects[ objectName ].parts[ constraint.body ].matterBody : undefined


                        Matter.Composite.add( composite, Matter.Constraint.create( {
                            bodyA,
                            bodyB,
                            pointA: constraint.pointA,
                            pointB: constraint.pointB,
                            stiffness: typeof constraint.stiffness == "number" ? constraint.stiffness : 1,
                            length: typeof constraint.length == "number" ? constraint.length : 1
                        } ) )
                    }

                    if ( bodyConfig.constraints ) {
                        forEach( bodyConfig.constraints, ( constraint, index )=>{
                            let bodyA = modules.objects[ objectName ].parts[ name ].matterBody
                            let bodyB = modules.objects[ objectName ].parts[ constraint.body ] ? modules.objects[ objectName ].parts[ constraint.body ].matterBody : undefined;


                            Matter.Composite.add( composite, Matter.Constraint.create( {
                                bodyA,
                                bodyB,
                                pointA: constraint.pointA,
                                pointB: constraint.pointB,
                                stiffness: typeof constraint.stiffness == "number" ? constraint.stiffness : 1,
                                length: typeof constraint.length == "number" ? constraint.length : 1
                            } ) )
                        } )
                    }

                } )

    
                modules.objects[ objectName ].composite = composite
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
        hideChunk ( chunkIndex, remove ) {
            if ( !this.modules.activeChunks[ chunkIndex ] ) {
                return
            } else {
                delete this.modules.activeChunks[ chunkIndex ]

                this.modules.scene.remove( this.modules.chunks[ chunkIndex ].mesh )
                
                if ( remove || !this.saveChunks ) {
                    this.modules.chunks[ chunkIndex ].mesh.geometry.dispose()
                }

                if ( this.modules.chunks[ chunkIndex ].matterBody ) {
                    Matter.Composite.remove( this.modules.matter.engine.world, [ this.modules.chunks[ chunkIndex ].matterBody ] )
                    // Matter.Composite.remove( this.modules.matter.world, [ y ] )
                    // this.modules.matter.world.remove( this.modules.chunks[ chunkIndex ].matterBod )

                }
                
                if ( remove || !this.saveChunks ) {
                    delete this.modules.chunks[ chunkIndex ]
                }
            }
            
        },
        showChunk ( chunkIndex ) {
            if ( this.modules.activeChunks[ chunkIndex ] ) {
                return
            } else {
                this.modules.activeChunks[ chunkIndex ] = true 
                this.modules.scene.add( this.modules.chunks[ chunkIndex ].mesh )
                Matter.World.add( this.modules.matter.engine.world, [ this.modules.chunks[ chunkIndex ].matterBody ] )
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

            this.modules.data.groundMaterial = material

            if ( this.$store.state.config.groundBumpMap ) {
                let bumpMap = this.laodTexture( this.$store.state.config.groundBumpMap )

                _.getter( material, "bumpScale", ()=>{
                    if ( this.$bumpmappingEnabled ) return (material._bumpScale * this.bumpmapMultiplier)
                }, ( value )=>{
                    material._bumpScale = value
                } )


                material.bumpMap = bumpMap
                bumpMap.flipY = false
                bumpMap.needsUpdate = true

                if ( typeof this.$store.state.config.groundBumpMapScale == "number" ) {
                    material.bumpScale = this.$store.state.config.groundBumpMapScale * DPR
                }

            }

            material.map.flipY = false
            material.map.needsUpdate = true

            

            let mesh = new THREE.Mesh( geometry, material )
            mesh.position.z = 1
            this.modules.scene.add( mesh )

            let matterBody = this.generateCurveMatterBody( points )

            matterBody.friction = this.$store.state.config.groundFriction
            matterBody.restitution = this.$store.state.config.groundRestirution
            matterBody.frictionAir = this.$store.state.config.groundFrictionAir

            Matter.World.add(modules.matter.engine.world, [ matterBody ]);

            this.modules.chunks[ chunkIndex ] = {
                mesh,
                matterBody,
                points,
            }

            this.fillChunk( chunkIndex )

            this.modules.activeChunks[ chunkIndex ] = true

        },
        fillChunk ( chunkIndex ) {
            let chunk = this.modules.chunks[ chunkIndex ]

            // console.log( chunk )

        },
        generatePathGeometry ( points ) {
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
                    let uvx = ( ( Math.abs(point.x) ) % ( scaleGroundTextureSize ) ) / (  scaleGroundTextureSize  )
                    let uvxNext = ( ( Math.abs(nextPoint.x) ) % ( scaleGroundTextureSize ) ) / (  scaleGroundTextureSize  )
                    let uvy = groundTextureUVYScale

                    if ( uvxNext < uvx ) {
                        uvxNext = 1
                    }

                    bufferGeometry.attributes.uv.setXY( position, uvx, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, point.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvxNext, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvx, uvy )
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, this.$store.state.config.groundHeight, 0 )



                    bufferGeometry.attributes.uv.setXY( position, uvxNext, 0 )
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, nextPoint.y, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvxNext, uvy)
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, nextPoint.x, this.$store.state.config.groundHeight, 0 )

                    bufferGeometry.attributes.uv.setXY( position, uvx, uvy)
                    bufferGeometry.attributes.normal.setXYZ( position, 0, 0, 1 )
                    bufferGeometry.attributes.position.setXYZ( position++, point.x, this.$store.state.config.groundHeight, 0 )

                }

            } )

            bufferGeometry.needsUpdate = true
            bufferGeometry.attributes.position.needsUpdate = true
            bufferGeometry.attributes.uv.needsUpdate = true

            return bufferGeometry
        },
        generateCurveMatterBody ( points ) {

            let matterPoints = points.slice()

            let lastPoint = points[ points.length - 1 ]
            let firstPoint = points[ 0 ]

            forEachRight( points, ( point )=>{
                matterPoints.push( {
                    x: point.x,
                    y: this.$store.state.config.groundHeight
                } )
            } )


            points.push( {
                x: firstPoint.x,
                y: firstPoint.y
            } )


            let body = Matter.Bodies.fromVertices( 0, 0, matterPoints, {
                isStatic: true,
                render: {
                    fillStyle: "#ff0000"
                }
            } )



            Matter.Body.translate( body, { x: firstPoint.x - ( body.bounds.min.x ), y: ( this.$store.state.config.groundHeight - body.bounds.max.y ) } )

            body.restitution = 0


            // body.static = true

            return body
        }
    }

}
   
</script>

<style lang="sass">
    import "sass/wonderland.scss"
</style>