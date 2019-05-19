<template>
    <div 
        ref="root"
        class="wonderland root"
        @click="onRootClick"
        @keydown.right.stop.prevent="engineActive = true"
        @keyup.right.stop.prevent="engineActive = false"
        @keydown.left.stop.prevent="breakActive = true"
        @keyup.left.stop.prevent="breakActive = false"

        @keydown.68.stop.prevent="engineActive = true"
        @keyup.68.stop.prevent="engineActive = false"
        @keydown.65.stop.prevent="breakActive = true"
        @keyup.65.stop.prevent="breakActive = false"

        @keydown.space.stop.prevent="$store.state.paused = !$store.state.paused"
        @keydown.69.stop.prevent="respawn()"
        @keydown.81.stop.prevent="revoke()"


        tabindex="-1" 
    >

        <canvas
            ref="canvas"
        ></canvas>
        <div
            ref="matterRenderer"
            class="matter-renderer"
            v-show="wonderMatterTestRenderer"
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
            v-show="!(pauseMenuShown || settingsMenuShown)"
            title="Клавиша 'Вверх' или 'D' "
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
            v-show="!(pauseMenuShown || settingsMenuShown)"
            title="Клавиша 'Вниз' или 'A' "
        >
            <p>Break</p>
        </div>
    </div>
</template>

<script>


import EffectComposer  from "three_fx/EffectComposer"
import RenderPass from "three_fx/passes/RenderPass"
import CopyShader from "three_fx/shaders/CopyShader"
import ShaderPass from "three_fx/passes/ShaderPass"
import RGBShiftShader from "three_fx/shaders/RGBShiftShader"
import ColorCorrectionShader from "three_fx/shaders/ColorCorrectionShader"
import FilmPass from "three_fx/passes/FilmPass"
import UnrealBloomPass from "three_fx/passes/UnrealBloomPass"    

import { forEach, forEachRight } from "lodash"
import _ from "Helpers"
import Hamer from "hammerjs"
import { TweenMax } from "gsap/TweenMax"
import SoundBlaster from "components/Wonderland/SoundBlaster"
import { mapState } from 'vuex'

import ChunkBufferGeometry from "components/Wonderland/ChunkBufferGeometry"

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
            hoursCount: 0,
            lastZ: 0,
            zGrid: 10000,
            orthographicCamera: {
                bounds: {
                    min: {
                        x: 0,
                        y: 0
                    },
                    max: {
                        x: 100,
                        y: 100
                    }
                }
            }
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
            "soundMuted",
            "enginePower",
            "groundFriction",
            "groundRestirution",
            "groundSkin",
            "wireframeMode",
            "wonderMatterTestRenderer",
            "wonderMatterTestRendererBounds",
            "wonderMatterTestRendererSize",
            "screenAspect",
            "pauseMenuShown",
            "settingsMenuShown",
            "timeScale",
            "fxEnabled",
            "isAndroid"
        ])
    },
    watch: {
        fxEnabled () {
            this.renderFrame()
        },
        timeScale ( value ) {
            this.modules.matter.engine.timing.timeScale = value
        },
        wonderMatterTestRendererSize ( value ) {
            this.renderFrame()
        },
        wonderMatterTestRenderer ( enabled ) {
            if ( enabled ) {
                // if ( !this.modules.matter.render ) {
                //     this.createMatterRenderer()                   
                // }

                // this.updateSize()
                Matter.Render.run( this.modules.matter.render )
                this.renderFrame()
            } else {
                Matter.Render.stop( this.modules.matter.render )
                this.renderFrame()
            }
        },
        wireframeMode ( enabled ){
            this.renderFrame()
        },
        groundSkin ( name ) {
            this.setGroundSkin( name )
        },
        groundFriction ( friction ) {
            forEach( this.modules.chunks, ( chunk )=>{
                if ( chunk.matterBody ) {
                    chunk.matterBody.friction = friction
                }
            } )
        },
        groundRestirution ( restitution ) {
            forEach( this.modules.chunks, ( chunk )=>{
                if ( chunk && chunk.matterBody ) {
                    chunk.matterBody.restitution = restitution
                }
            } )
        },
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
                this.stopRendering()
                TweenMax.pauseAll( TweenMax.getAllTweens() )
            } else {
                this.startRendering()
                TweenMax.resumeAll( TweenMax.getAllTweens() )
            }
        },
        bumpmapMultiplier ( value ) {
            this.renderFrame()
        },
        bumpmappingEnabled ( enabled ) {

            if ( enabled ) {
                this.modules.data.groundMaterial.bumpMap = this.modules.ground.currentGroundBumpMap
            } else {
                this.modules.data.groundMaterial.bumpMap = undefined
            }

            if ( enabled ) {
                this.modules.data.greeneryMaterial.bumpMap = this.modules.ground.currentGreeneryBumpMap
            } else {
                this.modules.data.greeneryMaterial.bumpMap = undefined
            }


            forEach( this.modules.renderGroups.objects.children, ( mesh )=>{
                mesh.material.needsUpdate = true
            } )

            if ( this.isAndroid && enabled ) {
                this.lightsZ = 1
            } else if ( this.isAndroid && !enabled ) {
                this.lightsZ = 1
            }

            this.modules.data.groundMaterial.needsUpdate = true
            this.modules.data.greeneryMaterial.needsUpdate = true
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

        this.modules = {
            fx: {
                passes: {}
            },
            renderGroups: {

            },
            ground: {
                currentGroundTexture: undefined,
                currentGroundBumpMap: undefined,
                currentGroundBumpScale: 1,
                currentGreeneryTexture: undefined,
                currentGreeneryBumpMap: undefined,
                currentGreeneryBumpScale: 1,
            },
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

        if ( this.$store.state.isAndroid && this.bumpmappingEnabled ) {
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
        this.setGroundSkin( this.$store.state.groundSkin )

        this.addChunk( -1 )
        this.addChunk( 0 )
        this.addChunk( 1 )
        // this.createObject("truck", wonder.$store.state.objects.truck, {
        //     spawnX: 300,
        //     spawnY: 300,
        //     collisionGroup: -1
        // })

        this.createObject("can1", wonder.$store.state.objects.can, 300, -250)
        this.createObject("can2", wonder.$store.state.objects.can, 300, -250)
        this.createObject("can3", wonder.$store.state.objects.can, 300, -250)
        this.createObject("box1",  wonder.$store.state.objects.box, 300, -250)
        this.createObject("box2",  wonder.$store.state.objects.box, 300, -250)
        this.createObject("box3",  wonder.$store.state.objects.box, 0, -800)
        this.createObject("box4",  wonder.$store.state.objects.box, 0, -800)

       

        this.createCar()

        this.createObject("moto", wonder.$store.state.objects.moto, {
            spawnX: 745,
            spawnY: 444,
            collisionGroup: -1
        })

        // this.createObject("can1", wonder.$store.state.objects.can, {
        //     x:  300,
        //     y: -250,
        //     collisionGroup: -1
        // })

        this.startRendering()

        if ( this.$store.state.isHybridApp ) {
            this.$store.state.mainThemePlays = true
        }

        this.modules.soundBlaster.mute( this.$store.state.soundMuted )

        this.$refs.root.focus()
    },
    methods: {
        setGroundSkin( name ) {
            if ( !this.$store.state.config.groundSkins[ name ] ) name = "forest"

            let modules = this.modules

            let data = this.$store.state.config.groundSkins[ name ]
            let texture = this.laodTexture( data.texture )
            let bumpMap = this.laodTexture( data.bumpMap )
            let bumpScale = data.bumpScale

            texture.flipY = false
            bumpMap.flipY = false

            modules.ground.currentGroundTexture = texture
            
            if ( this.bumpmappingEnabled ) {
                modules.ground.currentGroundBumpMap = bumpMap
            }

            modules.ground.currentGroundBumpScale = bumpScale

            forEach( modules.chunks, ( chunk )=>{
                if ( chunk && chunk.mesh ) {
                    chunk.mesh.material.map = texture
                    chunk.mesh.material.bumpMap = bumpMap
                    chunk.mesh.material.bumpScale = bumpScale
                    chunk.mesh.material.needsUpdate = true
                }
            } )

            let greeneryData = data.greenery
            let greeneryTexture = this.laodTexture( greeneryData.texture )
            let greeneryBumpMap = this.laodTexture( greeneryData.bumpMap )
            let greeneryBumpScale = greeneryData.bumpScale

            modules.ground.currentGreeneryTexture = greeneryTexture
            modules.ground.currentGreeneryBumpMap = greeneryBumpMap
            modules.ground.currentGreeneryBumpScale = greeneryBumpScale

            forEach( modules.chunks, ( chunk )=>{
                if ( chunk && chunk.greenery ) {
                    chunk.greenery.material.map = greeneryTexture
                    chunk.greenery.material.bumpMap = greeneryBumpMap
                    chunk.greenery.material.bumpScale = greeneryBumpScale
                    chunk.greenery.material.needsUpdate = true
                }
            } )

            this.renderFrame()
        },
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
            let bg_uniforms = modules.bg.material.uniforms

            /*colors*/
            let sunColor = new THREE.Color()
            sunColor.setHex( _.cssHex2Hex( hourData.sunColor ) )
            let skyColor = new THREE.Color()
            skyColor.setHex( _.cssHex2Hex( hourData.skyColor ) )
            let skyColorB = new THREE.Color()
            skyColorB.setHex( _.cssHex2Hex( hourData.skyColorB ) )


            if ( immediately ) {
                sun.intensity = hourData.intensity
                bg_uniforms.amplitude.value = hourData.amplitude
                bg_uniforms.waves.value = hourData.waves
                bg_uniforms.grid.value = hourData.grid

                this.sunOffset.x = hourData.sunOffset.x
                this.sunOffset.y = hourData.sunOffset.y
                this.sunOffset.z = hourData.sunOffset.z

                sun.color.r = sunColor.r
                sun.color.g = sunColor.g
                sun.color.b = sunColor.b

                bg_uniforms.diffuse.value.r = skyColor.r
                bg_uniforms.diffuse.value.g = skyColor.g
                bg_uniforms.diffuse.value.b = skyColor.b

                bg_uniforms.diffuseB.value.r = skyColorB.r
                bg_uniforms.diffuseB.value.g = skyColorB.g
                bg_uniforms.diffuseB.value.b = skyColorB.b


            } else {
                TweenMax.to( sun, duration, {
                    intensity: hourData.intensity,
                    ease: "linear"
                } )

                TweenMax.to( bg_uniforms.amplitude, duration, {
                    value: hourData.amplitude,
                    ease: "linear"
                } )

                TweenMax.to( bg_uniforms.waves, duration, {
                    value: hourData.waves,
                    ease: "linear"
                } )

                TweenMax.to( bg_uniforms.grid, duration, {
                    value: hourData.grid,
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


                TweenMax.to( bg_uniforms.diffuse.value, duration, {
                    r: skyColor.r,
                    g: skyColor.g,
                    b: skyColor.b,
                    ease: "linear"
                } )

                TweenMax.to( bg_uniforms.diffuseB.value, duration, {
                    r: skyColorB.r,
                    g: skyColorB.g,
                    b: skyColorB.b,
                    ease: "linear"
                } )
            }
        },
        getSpawnPosition ( x ) {

            let chunkLength = this.chunkLength
            let chunkIndex = _.nearestMult( 
                x, 
                ( chunkLength ),
                false,
                true
            ) / ( chunkLength )

            let chunk = this.modules.chunks[ chunkIndex ]

            if ( !chunk ) {
                this.addChunk( chunkIndex )
                chunk = this.modules.chunks[ chunkIndex ]
            }

            let count = this.$store.state.config.chunkSize
            let step = this.$store.state.config.curve.pointsStep
            let pointIndex = (_.nearestMult( x, step, false, false )) / step
            let pointIndexOffset = chunkIndex * count

            let point = chunk.points[ pointIndex - pointIndexOffset ]

            return point ? point.y : -500

        },
        spawnObject ( object, position ) {
            Matter.Body.setStatic( object.bodies[0], true )

            this.setBodiesPosition( object.bodies, position )                

            Matter.Body.setStatic(  object.bodies[0], false )
            this.freezeComposite( object )
        },
        revoke () {
            let car = this.modules.objects.car
            Matter.Body.setAngularVelocity( car.parts.hanger.matterBody, -0.13 )
        },
        respawn () {
            // let car = this.modules.objects.car
            // Matter.Body.setAngularVelocity( car.parts.hanger.matterBody, -0.1 )

            this.spawnObject( this.modules.objects.car.composite, {
                x: this.$store.state.carConfig.spawnPosition.x,
                y: this.getSpawnPosition( this.$store.state.carConfig.spawnPosition.x ) - 100
            } )
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
        setupRenderer () {
            let canvasElement = this.$refs.canvas
            let width = window.innerWidth * DPR
            let height = window.innerHeight * DPR


            let scene = new THREE.Scene()
            let camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.001, 100000 )
            // let camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 )
            let renderer = new THREE.WebGLRenderer({ 
                antialias: false, 
                canvas: canvasElement,
            })

            let composer = new EffectComposer( renderer )

            camera.position.z = this.$store.state.freeCameraZ
            camera.rotation.z = Math.PI
            camera.rotation.y = Math.PI

            // if ( !this.freeCamera ) {
            //     TweenMax.to( camera.position, 3, {
            //         z: this.$store.state.config.cameraPosition,
            //     } )

            // }

            TweenMax.fromTo( camera.rotation, 10, {
                z: Math.PI + (-Math.PI / 128)
            }, {
                z: Math.PI + (Math.PI / 128),
                repeat: -1,
                yoyo: true,
                ease: "Power1.easeInOut"
            } )

            let lightGroup = new THREE.Group()
            lightGroup.name = "lights"

            let pointLight = new THREE.PointLight( 0xffffff, 1, 100000 );
            pointLight.intensity = 1.2;
            pointLight.position.y = 0

            lightGroup.add( pointLight )

            // scene.add(lightGroup)

            renderer.setClearColor(0xfff17f)    


            let groundChunksGroup = new THREE.Group()
            let greeneryChunksGroup = new THREE.Group()
            groundChunksGroup.name = "ground-chunks"
            greeneryChunksGroup.name = "greenery-chunks"

            groundChunksGroup.position.z = -3;
            greeneryChunksGroup.position.z = 10;
            greeneryChunksGroup.position.y = 20
            let objectsGroup = new THREE.Group()
            objectsGroup.name = "objects"

            scene.add(greeneryChunksGroup)
            scene.add(groundChunksGroup)
            scene.add(objectsGroup)

            this.modules.renderGroups.greenery = greeneryChunksGroup
            this.modules.renderGroups.objects = objectsGroup
            this.modules.renderGroups.groundChunks = groundChunksGroup


            this.modules.scene = scene
            this.modules.camera = camera
            this.modules.renderer = renderer
            this.modules.lightGroup = lightGroup
            this.modules.pointLight = pointLight
            this.modules.composer = composer

            this.setupComposer()

            setInterval( ()=>{
                this.modules.time.x += 0.01
                this.modules.time.x = this.modules.time.x % 10
            }, 1000 / 30 )
        },
        setupComposer () {
            let renderPass = new RenderPass(this.modules.scene, this.modules.camera)
            let filmPass = new FilmPass(0.3333, 0.7, 10, false )
            let copyPass = new ShaderPass(CopyShader)
            let rgbsPass = new ShaderPass(RGBShiftShader)
            let colorCorPass = new ShaderPass(ColorCorrectionShader)

            rgbsPass.material.uniforms.amount.value = 0.0022
            this.modules.fx.passes = { 
                renderPass, 
                filmPass, 
                copyPass,
                rgbsPass,
                colorCorPass
            }

            this.modules.composer.addPass(renderPass);
            this.modules.composer.addPass(colorCorPass)
            this.modules.composer.addPass(rgbsPass)
            this.modules.composer.addPass(filmPass)
            this.modules.composer.addPass(copyPass)
        },
        setupMatterEngine () {
            let modules = this.modules


            // create an engine
            var engine = Matter.Engine.create( {
                positionIterations: 1,
                velocityIterations: 1,
                constraintIterations: 1,
                // enableSleeping: true,
            } );

            engine.timing.timeScale = this.timeScale


            // add all of the bodies to the world
            // run the engine
            modules.matter.engine = engine
            
            // modules.matter.engine.world.gravity.x = this.$store.state.gravityX
            modules.matter.engine.world.gravity.y = this.$store.state.config.gravityY 
            // modules.matter.render = render
            

            // run the renderer
            this.createMatterRenderer()


            // run the renderer
        },
        createMatterRenderer () {
            let boundsConfig = this.wonderMatterTestRendererBounds

            let minx = boundsConfig.x
            let miny = boundsConfig.y
            let maxy = boundsConfig.y + boundsConfig.height
            let maxx = boundsConfig.x + boundsConfig.width

            let render = Matter.Render.create({
                element: this.$refs.matterRenderer,
                engine: this.modules.matter.engine,
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
            });

            this.modules.matter.render = render
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
            let fragShader = require( "raw-loader!shaders/waves.frag" ).default
            // let fragShader = require( "raw-loader!shaders/helix.frag" ).default

            let geometry = new THREE.PlaneGeometry( 1, 1, 1)
            // geometry.translate( height / 2, width / 2, 0 )

            let bg = new THREE.Mesh ( geometry, new THREE.ShaderMaterial( {
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    diffuse: {
                        value: new THREE.Color(),
                    },
                    diffuseB: {
                        value: new THREE.Color()
                    },
                    amplitude: {
                        value: 1,
                    },
                    waves: {
                        value: 20
                    },
                    grid: {
                        value: 5
                    },
                    camera: {
                        value: modules.camera.position
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

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                Matter.Render.run( this.modules.matter.render )
            }
            // modules.matter.runner = Engine.run(modules.matter.engine);
            this.render()
        },
        render () {
            let modules = this.modules
            let now = +new Date()
            let delta = now - this.prevRenderedFrameTime

            if ( delta > 64 ) {
                delta = 64

            }
            this.prevRenderedFrameTime = now

            this.rafId = requestAnimationFrame( ()=> this.render() )

            this.updateThings( delta || 0 )
            this.renderFrame( delta )

           

        },
        updateMatterRendererBounds () {
            if ( ! this.modules.matter.render ) return
            let cameraPosition = this.modules.camera.position
            let render = this.modules.matter.render

                
            let width = window.innerWidth * DPR * this.wonderMatterTestRendererSize
            let height = window.innerHeight * DPR * this.wonderMatterTestRendererSize
            let screenAspect = width / height


            render.bounds.min.x = cameraPosition.x - ((width) / 2)
            render.bounds.min.y = cameraPosition.y - (height / 2)
            render.bounds.max.x = render.bounds.min.x + width * screenAspect
            render.bounds.max.y = render.bounds.min.y + height

        },
        updateThings (delta) {
            let modules = this.modules

            let cameraOffset = this.$store.state.config.cameraOffset
            modules.camera.position.y =  modules.objects.car.parts.wheelA.mesh.position.y + cameraOffset.y
            modules.camera.position.x =  modules.objects.car.parts.wheelA.mesh.position.x + cameraOffset.x

            if ( this.wonderMatterTestRenderer ) {
                this.updateMatterRendererBounds()
            }

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
                Matter.Body.setAngularVelocity( this.modules.objects.car.parts.wheelA.matterBody, this.acceleration * this.enginePower )
                Matter.Body.setAngularVelocity( this.modules.objects.car.parts.wheelB.matterBody, this.acceleration * this.enginePower )

            }

            Matter.Body.setAngularVelocity( this.modules.objects.moto.parts.wheelA.matterBody, 0.99 )
            Matter.Body.setAngularVelocity( this.modules.objects.moto.parts.wheelB.matterBody, 0.99 )

            if (  this.modules.objects.moto.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.moto.composite, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x- 500,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x - 500 ) - 100,
                } )
            }

            if (  this.modules.objects.can1.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.can1, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x- 350,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x - 350 ) - 100,
                } )
            }

            if (  this.modules.objects.can2.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.can2, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x- 350,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x - 350 ) - 100,
                } )
            }

            if (  this.modules.objects.can3.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.can3, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x- 350,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x - 350 ) - 100,
                } )
            }

             if (  this.modules.objects.box1.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.box1, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x + 600,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x + 600 ) - 100,
                } )
            }

            if (  this.modules.objects.box2.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.box2, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x + 600,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x + 600 ) - 100,
                } )
            }

            if (  this.modules.objects.box3.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.box3, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x + 600,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x + 600 ) - 100,
                } )
            }

            if (  this.modules.objects.box4.parts.corpse.matterBody.position.y > 2000 ) {
                this.spawnObject( this.modules.objects.box4, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x + 600,
                    y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x + 600 ) - 100,
                } )
            }

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
                ) / ( chunkLength );

                this.currentChunkIndex = currentChunkIndex

            }
        },
        setBodiesPosition ( bodies, position ) {
            forEach( bodies, ( body )=>{
                Matter.Body.setPosition( body, position )
            } )
        },
        freezeComposite ( composite ) {
            forEach( composite.bodies, ( body )=>{
                Matter.Body.setVelocity( body, { x: 0, y: 0 } )
                Matter.Body.setAngularVelocity( body, 0 )
            } )
        },  
        renderFrame ( ) {
            if ( this.fxEnabled ) {
                this.modules.composer.render()
            } else {
                this.modules.renderer.render( this.modules.scene, this.modules.camera )            
            }
        },
        stopRendering () {
            this.renderingActive = false
            // Matter.Runner.stop( modules.matter.runner )

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                Matter.Render.stop( this.modules.matter.render )
            }

            cancelAnimationFrame( this.rafId )
        },
        updateSize () {
            let modules = this.modules

            let canvasElement = this.$refs.canvas

            let width = window.innerWidth * window.devicePixelRatio
            let height = window.innerHeight * window.devicePixelRatio

            modules.camera.aspect = this.$store.state.screenAspect =  width / height
            // modules.camera.position.x = modules.lightGroup.position.x = width / 2
            // modules.camera.position.y = 
            // modules.camera.position.z = modules.lightGroup.position.z = ( ( Math.sqrt( 3 ) / 2 ) * height )

            // modules.lightGroup.position.z

            modules.pointLight.position.y = -height / 2

            modules.size.x = width
            modules.size.y = height

            modules.camera.updateProjectionMatrix()
            modules.renderer.setSize( width, height )
            modules.composer.setSize(window.innerWidth, window.innerHeight)

            if ( this.wonderMatterTestRenderer && this.modules.matter.render ) {
                this.modules.matter.render.options.width = width
                this.modules.matter.render.options.height = height
                this.updateMatterRendererBounds()
            }
        },

        createCar () {
            this.createObject( "car", this.$store.state.carConfig )
            this.spawnObject( this.modules.objects.car.composite, {
                x: this.$store.state.carConfig.spawnPosition.x,
                y: this.getSpawnPosition( this.$store.state.carConfig.spawnPosition.x ) - 10
            } )
        },
        createObject ( objectName, config, params) {
            let modules = this.modules
            let spawnX 
            let spawnY
            let composite
            let collisionGroup = -1

            if ( params && typeof params.spawnX == "number" ) {
                spawnX = params.spawnX || 0
            } else if ( config.spawnPosition ) {
                spawnX = config.spawnPosition.x || 0
            } else {
                spawnX = 0
            }

            if ( params && typeof params.spawnY == "number" ) {
                spawnY = params.spawnY ||  0
            } else if ( config.spawnPosition ) {
                spawnY = config.spawnPosition.y ||  0
            } else {
                spawnY = 0
            }            

            if ( params && typeof params.collisionGroup == "number" ) {
                collisionGroup = params.collisionGroup
            } else {
                collisionGroup = config.collisionGroup || 0
            }

            forEach( config.bodies, ( bodyConfig, name )=>{
                let geometry
                let material
                let matterBody

                let x = spawnX + (bodyConfig.x || 0)
                let y = spawnY + (bodyConfig.y || 0)

                let zIndex = bodyConfig.zIndex  == "number" ? bodyConfig.zIndex : 0;

                modules.objects[ objectName ] = modules.objects[ objectName ]  || {
                    parts: {},
                    bodies: []
                }

                switch ( bodyConfig.geometry ) {
                    case "rectangle":
                        geometry = new THREE.PlaneBufferGeometry( bodyConfig.width, bodyConfig.height, 1 )
                        // geometry.translate( bodyConfig.width/2, 0, 0 )
                        matterBody = Matter.Bodies.rectangle( x, y, bodyConfig.width, bodyConfig.height, {
                            collisionFilter: {
                                group: collisionGroup
                            },
                            chamfer: {
                                radius: bodyConfig.chamfer || 0
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
                                group: collisionGroup
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
                    side: THREE.DoubleSide,
                } )

                


                _.getter( material, "wireframe", ()=>{
                    return this.wireframeMode
                } )

                if ( texture && typeof bodyConfig.textureFlip == "boolean" ) {
                    material.map.flipY = !bodyConfig.textureFlip
                    material.map.needsUpdate = true
                }

                if ( bodyConfig.bumpMap ) {
                    let bumpMap = this.laodTexture( bodyConfig.bumpMap )

                    _.getter( material, "bumpMap", ()=>{
                        if ( this.bumpmappingEnabled ) {
                            return bumpMap
                        }
                    } )

                    _.getter( material, "bumpScale", ()=>{
                        return (material._bumpScale * this.bumpmapMultiplier * DPR)
                    }, ( value )=>{
                        material._bumpScale = value
                    } )


                    if ( typeof bodyConfig.bumpScale == "number" ) {
                        material.bumpScale = bodyConfig.bumpScale
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

                modules.objects[ objectName ].bodies.push( matterBody )

                modules.renderGroups.objects.add( mesh )

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

                    if ( (points[ index ].x / step) % tuple[3] === 0 ) {
                        points[ index ].y += Math.pow( Math.sin( a / tuple[ 0 ] ), tuple[2] ) * tuple[ 1 ]                        
                    }

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

                this.modules.renderGroups.groundChunks.remove( this.modules.chunks[ chunkIndex ].mesh )
                this.modules.renderGroups.greenery.remove( this.modules.chunks[ chunkIndex ].greenery )
                
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
        setMatterRendererBounds () {

        },
        showChunk ( chunkIndex ) {
            if ( this.modules.activeChunks[ chunkIndex ] ) {
                return
            } else {
                this.modules.activeChunks[ chunkIndex ] = true 
                this.modules.renderGroups.groundChunks.add( this.modules.chunks[ chunkIndex ].mesh )
                this.modules.renderGroups.greenery.add( this.modules.chunks[ chunkIndex ].greenery )
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

            let groundGeometry = new ChunkBufferGeometry( {
                points,
                textureSize: this.$store.state.config.groundTextureSize,
                pointsStep: this.$store.state.config.curve.pointsStep,
                textureUVYScale: this.$store.state.config.groundTextureUVYScale,
                groundHeight: this.$store.state.config.groundHeight,
                normalZ: 1
            } )

            let groundMaterial

            if ( modules.data.groundMaterial ) {
                groundMaterial = this.modules.data.groundMaterial
            } else {
                let groundMaterial

                if ( modules.data.groundMaterial ) {
                    groundMaterial = modules.data.groundMaterial
                } else {
                    groundMaterial = modules.data.groundMaterial = new THREE.MeshPhongMaterial( {
                        side: THREE.DoubleSide,
                        color: _.cssHex2Hex( this.$store.state.config.groundColor ),
                        map: modules.ground.currentGroundTexture,
                        transparent: true
                    } ) 

                    _.getter( groundMaterial, "wireframe", ()=>{
                        return this.wireframeMode
                    } )

                     _.getter( groundMaterial, "bumpScale", ()=>{
                        return ( groundMaterial._bumpScale * this.bumpmapMultiplier * DPR )
                    }, ( value )=>{
                        groundMaterial._bumpScale = value
                    } )

                    if ( this.bumpmappingEnabled ) {
                        groundMaterial.bumpMap = modules.ground.currentGroundBumpMap
                    }

                    groundMaterial.bumpScale = modules.ground.currentGroundBumpScale
                }
            }
            // groundMaterial.bumpmapMultiplier = bumpMap
            let groundMesh = new THREE.Mesh( groundGeometry, groundMaterial )
            modules.renderGroups.groundChunks.add( groundMesh )

            let matterBody = this.generateCurveMatterBody( points )

            matterBody.friction = this.groundFriction
            matterBody.restitution = this.groundRestirution
            matterBody.frictionAir = this.$store.state.config.groundFrictionAir

            Matter.World.add(modules.matter.engine.world, [ matterBody ]);

            /*greenery*/
            let greeneryGeometry = new ChunkBufferGeometry( {
                points,
                textureSize: this.$store.state.config.greeneryTextureSize,
                pointsStep: this.$store.state.config.curve.pointsStep,
                textureUVYScale: this.$store.state.config.greeneryTextureUVYScale,
                groundHeight: -this.$store.state.config.greeneryHeight,
                normalZ: -1
            } )
            
            let greeneryMaterial

            if ( modules.data.greeneryMaterial ) {
                greeneryMaterial =  modules.data.greeneryMaterial
            } else {
                greeneryMaterial = modules.data.greeneryMaterial = new THREE.MeshPhongMaterial( {
                    map: modules.ground.currentGreeneryTexture,
                    bumpMap: modules.ground.currentGreeneryBumpMap,
                    transparent: true,
                    side: THREE.DoubleSide,
                } )

                _.getter( greeneryMaterial, "wireframe", ()=>{
                    return this.wireframeMode
                } )

                 _.getter( greeneryMaterial, "bumpScale", ()=>{
                    return ( greeneryMaterial._bumpScale * this.bumpmapMultiplier * DPR )
                }, ( value )=>{
                    greeneryMaterial._bumpScale = value
                } )

                if ( this.bumpmappingEnabled ) {
                    greeneryMaterial.bumpMap = modules.ground.currentGreeneryBumpMap
                }

                greeneryMaterial.bumpScale = modules.ground.currentGreeneryBumpScale

            }

            let greeneryMesh = new THREE.Mesh( greeneryGeometry, greeneryMaterial )
            modules.renderGroups.greenery.add( greeneryMesh )

            modules.chunks[ chunkIndex ] = {
                mesh: groundMesh,
                matterBody,
                points,
                greenery: greeneryMesh
            }

            modules.activeChunks[ chunkIndex ] = true

        },
        fillChunk ( chunkIndex ) {
            let chunk = this.modules.chunks[ chunkIndex ]


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


            // matterPoints.push( {
            //     x: firstPoint.x,
            //     y: firstPoint.y
            // } )


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