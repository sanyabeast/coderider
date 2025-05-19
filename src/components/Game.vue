<template>
    <div 
        ref="root"
        class="game root"
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
        @keydown.27.stop.prevent="$store.state.paused = false; "
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

        <!-- <svg
            class="svg-layer"
            width="100"
            height=100
            ref="svgLayer"

        >
            <Speedometer
                ref="speedometer"
            />
        </svg> -->

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
            title="'Up' key or 'D' key "
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
            title="'Down' key or 'A' key"
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
import SoundBlaster from "components/Game/SoundBlaster"
import { mapState } from 'vuex'

import ChunkBufferGeometry from "components/Game/ChunkBufferGeometry"

import decomp from 'poly-decomp'
window.decomp = decomp

const Matter = window.Matter = require("matter-js")
const DPR = window.devicePixelRatio

export default {
    components: { },
    data () {
        return {
            prevRenderedFrameTime: +new Date(),
            engineActive: false,
            breakActive: false,
            acceleration: 0,
            currentChunkIndex: 0,
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
            "isAndroid",
            "renderingResolution"
        ])
    },
    watch: {
        renderingResolution () {clog(1)
            this.updateSize()
            this.renderFrame()
        },
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

            if (this.modules.data.groundMaterial) {
                if ( enabled ) {
                    this.modules.data.groundMaterial.normalMap = this.modules.ground.currentGroundNormalMap
                } else {
                    this.modules.data.groundMaterial.normalMap = undefined
                }
            }

            if (this.modules.data.greeneryMaterial) {
                if ( enabled ) {
                    this.modules.data.greeneryMaterial.normalMap = this.modules.ground.currentGreeneryNormalMap
                } else {
                    this.modules.data.greeneryMaterial.normalMap = undefined
                }
            }


            // Update object materials
            forEach( this.modules.renderGroups.objects.children, ( mesh )=>{
                if (mesh && mesh.material) {
                    mesh.material.needsUpdate = true
                }
            } )

            // Update ground and greenery materials with proper null checks
            if (this.modules.data.groundMaterial) {
                this.modules.data.groundMaterial.needsUpdate = true
            }
            
            if (this.modules.data.greeneryMaterial) {
                this.modules.data.greeneryMaterial.needsUpdate = true
            }
            
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

        window.addEventListener("gamepadconnected", function(e) {
          console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index, e.gamepad.id,
            e.gamepad.buttons.length, e.gamepad.axes.length);
        });

        this.modules = {
            fx: {
                passes: {}
            },
            renderGroups: {

            },
            ground: {
                currentGroundTexture: undefined,
                currentGroundNormalMap: undefined,
                currentGroundNormalScale: 1,
                currentGreeneryTexture: undefined,
                currentGreeneryNormalMap: undefined,
                currentGreeneryNormalScale: 1,
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


        this.setupRenderer()
        this.setupBackground()
        this.setupMatterEngine()
        this.setupLights()
        this.updateSize()

        window.addEventListener( "resize", ()=>{
            this.updateSize()
        } )

        
        this.setupDaynight()

        // Ensure normal maps are loaded and available before creating initial chunks
        this.setGroundSkin( this.$store.state.groundSkin )

        // Force bumpmappingEnabled to true for initial chunk creation
        let originalBumpmappingEnabled = this.$store.state.bumpmappingEnabled;
        this.$store.state.bumpmappingEnabled = true;
        
        // Create initial chunks
        this.addChunk( -1 )
        this.addChunk( 0 )
        this.addChunk( 1 )
        
        // Restore the original bumpmappingEnabled setting
        this.$store.state.bumpmappingEnabled = originalBumpmappingEnabled;
        // this.createObject("truck", this.$store.state.objects.truck, {
        //     spawnX: 300,
        //     spawnY: 300,
        //     collisionGroup: -1
        // })

        this.modules.objects.stuff = {}
        this.modules.objects.motos = {}

        let count = 5  // Reduced from 15 to further minimize random props

        for ( let a = 0; a < count; a++ ) {
            this.modules.objects.stuff[`can${a}`] = this.createObject(`can${a}`, this.$store.state.objects.can, 300, -250)
        }

        for ( let b = 0; b < count; b++ ) {
            this.modules.objects.stuff[`box${b}`] = this.createObject(`box${b}`, this.$store.state.objects.box, 300, -250)
        }

        let moto_count = 1

        for ( let c = 0; c < moto_count; c++ ) {
            this.modules.objects.motos[`moto${c}`] = this.createObject(`moto${c}`, this.$store.state.objects.moto, {
                spawnX: 300,
                spawnY: -225,
                collisionGroup: -1
            })
        }



        this.createCar()

        
        // this.createObject("can1", this.$store.state.objects.can, {
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
            let texture = this.laodTexture(data.texture)
            
            // Always use the naming convention regardless of what's in the config
            // This ensures we use dirt_a_n.png instead of bumps/dirt_a.png
            let normalMap = this.loadNormalMap(data.texture)
            
            // Normalize the scale for normal maps - they need much lower values than bump maps
            // Cap the maximum scale and reduce very high values
            let rawScale = data.bumpScale || 1.0
            let normalScale = Math.min(rawScale, 5.0) // Cap at 5.0 maximum
            
            // For very high values (like 40), reduce them more aggressively
            if (rawScale > 10) {
                normalScale = 2.0 + (rawScale - 10) * 0.1 // Scale down high values
            }

            if (texture) texture.flipY = false
            if (normalMap) normalMap.flipY = false

            modules.ground.currentGroundTexture = texture
            modules.ground.currentGroundNormalMap = normalMap
            modules.ground.currentGroundNormalScale = normalScale

            forEach( modules.chunks, ( chunk )=>{
                if ( chunk && chunk.mesh ) {
                    // When changing environments, recreate the material from scratch
                    // instead of modifying existing material to ensure consistent appearance
                    let newMaterial = new THREE.MeshStandardMaterial({
                        map: texture,
                        normalMap: this.bumpmappingEnabled ? normalMap : null,
                        metalness: 0,         // Non-metallic (organic material)
                        roughness: 1.0,       // Completely rough/matte
                        side: THREE.DoubleSide
                    });
                    
                    // Store the base normal scale value
                    newMaterial._normalScale = normalScale;
                    
                    // Create dynamic getter for normalScale that responds to bumpmapMultiplier changes
                    _.getter(newMaterial, "normalScale", () => {
                        return new THREE.Vector2(
                            newMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR,
                            newMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR
                        )
                    }, (value) => {
                        // Store base value when set directly
                        newMaterial._normalScale = typeof value === 'number' ? value : value.x
                    });
                    
                    // Add wireframe getter
                    _.getter(newMaterial, "wireframe", () => {
                        return this.wireframeMode
                    });
                    
                    // Replace the material
                    chunk.mesh.material = newMaterial;
                    chunk.mesh.material.needsUpdate = true
                }
            } )

            let greeneryData = data.greenery
            let greeneryTexture = this.laodTexture(greeneryData.texture)
            
            // Always use the naming convention for normal maps
            let greeneryNormalMap = this.loadNormalMap(greeneryData.texture)
            
            // Normalize the scale for normal maps - apply consistent scaling
            let rawGreeneryScale = greeneryData.bumpScale || 1.0
            let greeneryNormalScale = Math.min(rawGreeneryScale, 3.0) // Cap at 3.0 maximum for greenery

            modules.ground.currentGreeneryTexture = greeneryTexture
            modules.ground.currentGreeneryNormalMap = greeneryNormalMap
            modules.ground.currentGreeneryNormalScale = greeneryNormalScale

            forEach( modules.chunks, ( chunk )=>{
                if ( chunk && chunk.greenery ) {
                    // When changing environments, recreate the greenery material from scratch
                    // instead of modifying existing material to ensure consistent appearance
                    let newGreeneryMaterial = new THREE.MeshStandardMaterial({
                        map: greeneryTexture,
                        normalMap: this.bumpmappingEnabled ? greeneryNormalMap : null,
                        metalness: 0,         // Non-metallic (plants)
                        roughness: 1.0,       // Completely rough/matte 
                        side: THREE.DoubleSide,
                        transparent: true,
                        alphaTest: 0.5
                    });
                    
                    // Store the base normal scale value
                    newGreeneryMaterial._normalScale = greeneryNormalScale;
                    
                    // Create dynamic getter for normalScale that responds to bumpmapMultiplier changes
                    _.getter(newGreeneryMaterial, "normalScale", () => {
                        return new THREE.Vector2(
                            newGreeneryMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR,
                            newGreeneryMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR
                        )
                    }, (value) => {
                        // Store base value when set directly
                        newGreeneryMaterial._normalScale = typeof value === 'number' ? value : value.x
                    });
                    
                    // Add wireframe getter
                    _.getter(newGreeneryMaterial, "wireframe", () => {
                        return this.wireframeMode
                    });
                    
                    // Replace the material
                    chunk.greenery.material = newGreeneryMaterial;
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
        laodTexture(name, catchErrors = false) {
            let modules = this.modules

            if (modules.data.textures[name]) return modules.data.textures[name]
            
            try {
                // Fix path back to original - use res/pics/ instead of /res/img/
                let texture = new THREE.TextureLoader().load(`res/pics/${name}`)
                texture.wrapT = THREE.RepeatWrapping
                texture.wrapS = THREE.RepeatWrapping
                
                // Store successful loads in cache
                modules.data.textures[name] = texture
                return texture
            } catch (error) {
                if (!catchErrors) {
                    console.warn(`Failed to load texture: ${name}`, error)
                }
                return null
            }
        },
        
        // Try to load a normal map based on diffuse texture name
        loadNormalMap(textureName) {
            if (!textureName) return null
            
            // Simply add _n before the extension
            const dotIndex = textureName.lastIndexOf('.')
            const normalMapName = dotIndex >= 0 ?
                textureName.substring(0, dotIndex) + '_n' + textureName.substring(dotIndex) :
                textureName + '_n'
            
            // Try to load the normal map, but catch errors silently
            return this.laodTexture(normalMapName, true)
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
            let sun0 = this.modules.lights.sun0
            let sun1 = this.modules.lights.sun1
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
                sun0.intensity = hourData.intensity
                sun1.intensity = hourData.intensity
                bg_uniforms.amplitude.value = hourData.amplitude
                bg_uniforms.waves.value = hourData.waves
                bg_uniforms.grid.value = hourData.grid

                this.sunOffset.x = hourData.sunOffset.x
                this.sunOffset.y = hourData.sunOffset.y
                this.sunOffset.z = hourData.sunOffset.z

                sun0.color.r = sunColor.r
                sun0.color.g = sunColor.g
                sun0.color.b = sunColor.b

                sun1.color.r = sunColor.r
                sun1.color.g = sunColor.g
                sun1.color.b = sunColor.b

                bg_uniforms.diffuse.value.r = skyColor.r
                bg_uniforms.diffuse.value.g = skyColor.g
                bg_uniforms.diffuse.value.b = skyColor.b

                bg_uniforms.diffuseB.value.r = skyColorB.r
                bg_uniforms.diffuseB.value.g = skyColorB.g
                bg_uniforms.diffuseB.value.b = skyColorB.b


            } else {
                TweenMax.to( sun0, duration, {
                    intensity: hourData.intensity,
                    ease: "linear"
                } )

                TweenMax.to( sun1, duration, {
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

                TweenMax.to( sun1.color, duration, {
                    r: sunColor.r,
                    g: sunColor.g,
                    b: sunColor.b,
                    ease: "linear"
                } )

                TweenMax.to( sun1.color, duration, {
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

            renderer.autoClear = false
            renderer.autoClearColor = false
            renderer.autoClearDepth = false
            renderer.autoClearStencil = false

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
            // Initialize all passes
            let renderPass = new RenderPass(this.modules.scene, this.modules.camera)
            
            // Color correction for better contrast and vibrancy
            let colorCorPass = new ShaderPass(ColorCorrectionShader)
            colorCorPass.uniforms.powRGB.value = new THREE.Vector3(1.1, 1.1, 1.15) // Slightly increase blue for sky
            colorCorPass.uniforms.mulRGB.value = new THREE.Vector3(1.2, 1.15, 1.1) // Better contrast
            
            // Subtle RGB shift for a slight chromatic aberration effect
            let rgbsPass = new ShaderPass(RGBShiftShader)
            rgbsPass.material.uniforms.amount.value = 0.0015 // Reduced from 0.0022 for more subtlety
            rgbsPass.material.uniforms.angle.value = 0.5 // Angle of shift
            
            // Minimal film grain without strong scanlines
            // Parameters: (noise intensity, scanline intensity, scanline count, grayscale)
            let filmPass = new FilmPass(0.15, 0.1, 480, false)  // Reduced scanline intensity from 0.45 to 0.1
            
            // Almost imperceptible bloom effect
            const bloomParams = {
                strength: 0.05,    // Drastically reduced bloom strength
                radius: 0.2,       // Very small bloom radius
                threshold: 0.95    // Very high threshold so it barely affects anything
            }
            let bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                bloomParams.strength,
                bloomParams.radius,
                bloomParams.threshold
            )
            
            // Final copy to screen
            let copyPass = new ShaderPass(CopyShader)
            copyPass.renderToScreen = true
            
            // Store all passes for easy reference
            this.modules.fx.passes = { 
                renderPass,
                colorCorPass,
                rgbsPass,
                bloomPass,
                filmPass,
                copyPass
            }
            
            // Enable/disable post-processing based on fxEnabled state
            _.getter(renderPass, "renderToScreen", () => !this.fxEnabled, () => {})
            _.getter([colorCorPass, rgbsPass, bloomPass, filmPass, copyPass], "enabled", () => this.fxEnabled)
            
            // Add passes in the correct order
            this.modules.composer.addPass(renderPass)     // Render the scene
            this.modules.composer.addPass(bloomPass)      // Add bloom first
            this.modules.composer.addPass(colorCorPass)   // Then correct colors
            this.modules.composer.addPass(rgbsPass)       // Add subtle RGB shift
            this.modules.composer.addPass(filmPass)       // Add film grain last
            this.modules.composer.addPass(copyPass)       // Copy to screen
            
            // Dynamic day/night effect on bloom strength
            _.getter(bloomPass, "strength", () => {
                // Increase bloom at night for better lighting effects
                if (this.hour >= 18 || this.hour <= 6) {
                    return bloomParams.strength * 1.5
                }
                return bloomParams.strength
            })
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

            // Main directional lights
            let sun0 = new THREE.PointLight( _.cssHex2Hex( this.$store.state.config.sunColor ), 1, 1000000 )
            let sun1 = new THREE.PointLight( _.cssHex2Hex( this.$store.state.config.sunColor ), 1, 1000000 )

            // Add a subtle blue ambient light to soften shadows
            let ambientLight = new THREE.AmbientLight(0x3c4a9f, 0.35)  // Dim blue ambient light
            
            modules.scene.add(ambientLight)
            modules.scene.add(sun0)
            modules.scene.add(sun1)

            // Store references for later use
            modules.lights.sun0 = sun0
            modules.lights.sun1 = sun1
            modules.lights.ambient = ambientLight
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
            
            // Current timestamp in milliseconds
            let now = +new Date()
            
            // How much time has passed since last frame (in ms)
            let frameTime = now - this.prevRenderedFrameTime
            this.prevRenderedFrameTime = now
            
            // Cap maximum frameTime to prevent spiral of death on slow devices
            if (frameTime > 100) {
                frameTime = 100
            }
            
            // Accumulate time since last frame
            this.accumulator = (this.accumulator || 0) + frameTime
            
            // Fixed physics timestep (16.67ms ≈ 60 updates per second)
            const fixedTimeStep = 1000 / 60
            
            // Update physics in fixed timesteps, independent of frame rate
            while (this.accumulator >= fixedTimeStep) {
                this.updateThings(fixedTimeStep)
                this.accumulator -= fixedTimeStep
            }
            
            // Render the frame
            this.renderFrame(frameTime)
            
            // Schedule next frame
            this.rafId = requestAnimationFrame(() => this.render())
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

            modules.lights.sun0.position.set( 
                modules.camera.position.x + this.sunOffset.x,  
                modules.camera.position.y + this.sunOffset.y, 
                (modules.camera.position.z * 4 ) * this.sunOffset.z
            )

            modules.lights.sun1.position.set( 
                modules.camera.position.x + this.sunOffset.x,  
                modules.camera.position.y + this.sunOffset.y, 
                (-1 * modules.camera.position.z * 4 ) * this.sunOffset.z
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

            forEach( this.modules.objects.motos, ( moto, name )=>{
                Matter.Body.setAngularVelocity( moto.parts.wheelA.matterBody, 0.811 )
                Matter.Body.setAngularVelocity( moto.parts.wheelB.matterBody, 0.811 )

                if (  moto.parts.corpse.matterBody.position.y > 1500 ) {
                    this.spawnObject( moto.composite, {
                        x: this.modules.objects.car.parts.corpse.matterBody.position.x- 659,
                        y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x - 659 ) - 100,
                    } )
                }

            } )

            
            forEach( this.modules.objects.stuff, ( object, name )=>{
                let offset = (Math.random() > 0.5 ? 2000 : -2000) * (0.5 + Math.random() * 0.5)

                if (  object.parts.corpse.matterBody.position.y > 1500 ) {
                    this.spawnObject( object, {
                        x: this.modules.objects.car.parts.corpse.matterBody.position.x + offset,
                        y: this.getSpawnPosition( this.modules.objects.car.parts.corpse.matterBody.position.x + offset ) - 50,
                    } )
                }
            } )

            /****************/

            if ( this.physicsEnabled ) {
                Matter.Engine.update(modules.matter.engine, 1000 / 60 );
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
            this.modules.composer.render()
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

            let width = window.innerWidth * this.renderingResolution
            let height = window.innerHeight * this.renderingResolution

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
            modules.composer.setSize( width, height )
            // this.$refs.svgLayer.setAttribute( "width", width )
            // this.$refs.svgLayer.setAttribute( "height", height )

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

                material = new THREE.MeshStandardMaterial( {
                    color,
                    map: texture,
                    transparent: true,
                    // depthTest: true,
                    metalness: 1,
                    roughness: 0.5,
                    side: THREE.DoubleSide,
                    shininess: 10, // Lower shininess for less glossy look
                    specular: new THREE.Color(0x222222) // Reduce specular highlights
                } )

                _.getter( material, "wireframe", ()=>{
                    return this.wireframeMode
                } )

                if ( texture && typeof bodyConfig.textureFlip == "boolean" ) {
                    material.map.flipY = !bodyConfig.textureFlip
                    material.map.needsUpdate = true
                }

                // Always use the naming convention for normal maps
                let normalMap = null
                
                if (bodyConfig.texture) {
                    normalMap = this.loadNormalMap(bodyConfig.texture)
                }
                
                if (normalMap) {
                    _.getter(material, "normalMap", () => {
                        if (this.bumpmappingEnabled) {
                            return normalMap
                        }
                    })
                    
                    _.getter(material, "normalScale", () => {
                        // Reduced normal mapping strength by half
                        return new THREE.Vector2(
                            material._normalScale * 0.5 * this.bumpmapMultiplier * DPR,
                            material._normalScale * 0.5 * this.bumpmapMultiplier * DPR
                        )
                    }, (value) => {
                        // For normalScale, we use Vector2 but we'll store a base scalar value
                        material._normalScale = typeof value === 'number' ? value : value.x
                    })
                    
                    if (typeof bodyConfig.bumpScale == "number") {
                        material.normalScale = bodyConfig.bumpScale
                    }
                    
                    if (typeof bodyConfig.textureFlip == "boolean") {
                        normalMap.flipY = !bodyConfig.textureFlip
                        normalMap.needsUpdate = true
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

            return modules.objects[ objectName ]
        },
        generatePoints ( chunkIndex ) {
            // Get configuration values
            let count = this.$store.state.config.chunkSize
            let start = chunkIndex * count
            let points = []
            let index = 0
            let step = this.$store.state.config.curve.pointsStep
            
            // Global seed to ensure consistent terrain across all chunks
            // This makes the entire world determined by a single global seed
            const GLOBAL_SEED = 6289371
            
            // Deterministic noise function that depends on position
            // We use a simple but effective pseudo-random noise function
            let globalNoise = (x, amplitude = 1, frequency = 1) => {
                // Use a combination of sine waves with different frequencies
                // This creates a continuous noise pattern
                return amplitude * (
                    Math.sin(x * 0.01 * frequency + GLOBAL_SEED * 0.1) * 0.5 +
                    Math.sin(x * 0.02 * frequency + GLOBAL_SEED * 0.2) * 0.3 +
                    Math.sin(x * 0.04 * frequency + GLOBAL_SEED * 0.3) * 0.2
                )
            }
            
            // Reduced terrain feature magnitudes to avoid distorting trees
            // Use global position rather than chunk-relative features for seamless transitions
            const FEATURE_SCALE = 0.5 // Scale down all feature sizes
            
            // Generate base points
            for(let a = start; a <= start + count; a++) {
                index = points.length
                let globalPos = a // Use global position for seamless features
                
                points.push({
                    x: a * step,
                    y: 0
                })
                
                // Apply standard sinusoid terrain with reduced magnitude
                forEach(this.$store.state.config.curve.sinMap, (tuple) => {
                    if ((points[index].x / step) % tuple[3] === 0) {
                        // Reduce magnitude by 30% to make terrain less extreme
                        let magnitude = tuple[1] * 0.7
                        points[index].y += Math.pow(Math.sin(a / tuple[0]), tuple[2]) * magnitude
                    }
                })
                
                // Determine terrain features based on global position, not chunk index
                // This ensures seamless transitions between chunks
                
                // Add gentler jumps every 1000 units
                if (Math.abs(globalPos % 1000) < 50) {
                    let distanceFromJump = Math.abs(globalPos % 1000 - 25)
                    if (distanceFromJump < 20) {
                        // Gentle hill-like jump with limited height
                        let jumpShape = Math.cos(distanceFromJump * (Math.PI / 20))
                        points[index].y += jumpShape * 40 * FEATURE_SCALE
                    }
                }
                
                // Small, gentle bumps for more interesting terrain
                // Combine several sine waves with different frequencies
                let bumps = globalNoise(globalPos * 0.5, 15, 1.5) * FEATURE_SCALE
                points[index].y += bumps
                
                // Add occasional gentle slopes
                if (Math.abs(globalPos % 1500) < 300) {
                    let slopePosition = (globalPos % 1500) / 300
                    let slopeIntensity = Math.sin(slopePosition * Math.PI) * 0.3
                    points[index].y += slopeIntensity * (globalPos % 3000 - 1500) * 0.05 * FEATURE_SCALE
                }
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
                    this.modules.chunks[ chunkIndex ].mesh.geometry.kill()
                    this.modules.chunks[ chunkIndex ].greenery.geometry.kill()
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

            // Always create a new material for consistency with environment switching
            // Don't use cached materials since they may have outdated textures
            let groundMaterial = new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
                color: _.cssHex2Hex(this.$store.state.config.groundColor),
                map: modules.ground.currentGroundTexture,  // Current texture from active environment
                normalMap: this.bumpmappingEnabled ? modules.ground.currentGroundNormalMap : null,
                transparent: true,
                metalness: 0,       // Non-metallic (organic material) 
                roughness: 1.0      // Completely rough/matte
            })

            // Add wireframe toggle
            _.getter(groundMaterial, "wireframe", ()=>{
                return this.wireframeMode
            })

            // Store the base normal scale value
            groundMaterial._normalScale = modules.ground.currentGroundNormalScale || 1.0;
            
            // Create dynamic getter for normalScale that works with the bumpmapMultiplier setting
            _.getter(groundMaterial, "normalScale", () => {
                return new THREE.Vector2(
                    groundMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR,
                    groundMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR
                )
            }, (value) => {
                groundMaterial._normalScale = typeof value === 'number' ? value : value.x;
            })
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

            // Always create a fresh material for greenery to ensure consistent appearance
            let greeneryMaterial = new THREE.MeshStandardMaterial({
                map: modules.ground.currentGreeneryTexture,
                normalMap: this.bumpmappingEnabled ? modules.ground.currentGreeneryNormalMap : null,
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.5,     // Needed for proper transparency in plants
                metalness: 0,        // Non-metallic (plants)
                roughness: 1.0       // Completely rough/matte
            })

            // Store the base normal scale value
            greeneryMaterial._normalScale = modules.ground.currentGreeneryNormalScale || 1.0;
            
            // Create dynamic getter for normalScale that responds to bumpmapMultiplier changes
            _.getter(greeneryMaterial, "normalScale", () => {
                return new THREE.Vector2(
                    greeneryMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR,
                    greeneryMaterial._normalScale * 0.5 * this.bumpmapMultiplier * DPR
                )
            }, (value) => {
                greeneryMaterial._normalScale = typeof value === 'number' ? value : value.x;
            })
            
            // Don't store for reuse - we want fresh materials for consistent appearance
            // modules.data.greeneryMaterial = greeneryMaterial

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
    import "sass/game.scss"
</style>