import {
    AmbientLight,
    CircleBufferGeometry,
    Color,
    DirectionalLight,
    DoubleSide,
    Group,
    Mesh,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneBufferGeometry,
    PlaneGeometry,
    PointLight,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import SoundBlaster from "./SoundBlaster";

import EffectComposer from "../../three_fx/EffectComposer";
import RenderPass from "../../three_fx/passes/RenderPass";
import CopyShader from "../../three_fx/shaders/CopyShader";
import ShaderPass from "../../three_fx/passes/ShaderPass";
import RGBShiftShader from "../../three_fx/shaders/RGBShiftShader";
import ColorCorrectionShader from "../../three_fx/shaders/ColorCorrectionShader";
import FilmPass from "../../three_fx/passes/FilmPass";
import UnrealBloomPass from "../../three_fx/passes/UnrealBloomPass";

import { TweenMax } from "gsap/TweenMax";

import { config, daynight, objects, carConfig } from "../../../res/data/data";
import { RepeatWrapping } from "three";
import { MeshStandardMaterial } from "three";
import _ from "../../Helpers";
import { forEach, forEachRight } from "lodash";
import Matter from "matter-js";
import ChunkBufferGeometry from "./ChunkBufferGeometry";
const DPR = window.devicePixelRatio;

export class Game {
    rootElement: HTMLElement;
    engineActive: boolean = false;
    breakActive: boolean = false;
    acceleration: number = 0;
    currentChunkIndex: number = 0;
    hour: number = 0;
    sunOffset: Vector3 = new Vector3(0, 0, 0);
    hoursCount: number = 0;

    renderingActive: boolean;
    dayCycleEnabled: boolean;
    dayCycleTimer: number;
    dayCycleDuration: number;
    paused: any = false;

    prevUpdateDate: number = +new Date();
    _accelerationTween: any;
    _rafId: number;

    canvas: HTMLCanvasElement;

    modules = {
        fx: {
            passes: {},
        },
        renderGroups: {
            objects: {},
        },
        ground: {
            currentGroundTexture: undefined,
            currentGroundNormalMap: undefined,
            currentGroundNormalScale: 1,
            currentGreeneryTexture: undefined,
            currentGreeneryNormalMap: undefined,
            currentGroundEmissionMap: undefined,
            currentGreeneryNormalScale: 1,
        },
        camera: undefined,
        scene: undefined,
        composer: undefined,
        soundBlaster: new SoundBlaster(),
        renderer: undefined,
        objects: {
            stuff: undefined,
            motos: undefined,
            car: undefined,
        },
        lights: {},
        data: {
            textures: {},
        },
        time: new Vector2(0, 0),
        matter: {},
        chunks: {},
        activeChunks: {},
        size: new Vector2(1, 1),
        car: {
            parts: {},
        },
    };
    headlightOffset: Vector3;

    get chunkLength(): number {
        return config.chunkSize * config.curve.pointsStep;
    }

    constructor(rootElement: HTMLElement, canvas: HTMLCanvasElement) {
        this.rootElement = rootElement;
        this.canvas = canvas;

        this.setupRenderer();
        this.setupBackground();
        this.setupMatterEngine();
        this.setupLights();
        this.updateSize();

        window.addEventListener("resize", () => {
            this.updateSize();
        });

        this.setupDaynight();

        // Ensure normal maps are loaded and available before creating initial chunks
        this.setGroundSkin(config.groundSkin);

        this.addChunk(-1);
        this.addChunk(0);
        this.addChunk(1);

        this.modules.objects.stuff = {};
        this.modules.objects.motos = {};

        let count = 5; // Reduced from 15 to further minimize random props

        for (let a = 0; a < count; a++) {
            this.modules.objects.stuff[`can${a}`] = this.createObject(
                `can${a}`,
                objects.can,
                300,
                -250
            );
        }

        for (let b = 0; b < count; b++) {
            this.modules.objects.stuff[`box${b}`] = this.createObject(
                `box${b}`,
                objects.box,
                300,
                -250
            );
        }

        let moto_count = 1;

        for (let c = 0; c < moto_count; c++) {
            this.modules.objects.motos[`moto${c}`] = this.createObject(
                `moto${c}`,
                objects.moto,
                {
                    spawnX: 300,
                    spawnY: -225,
                    collisionGroup: -1,
                }
            );
        }

        this.createCar();
        // this.createObject("can1", objects.can, {
        //     x:  300,
        //     y: -250,
        //     collisionGroup: -1
        // })

        this.startMainLoop();
        this.rootElement.focus();
    }

    setPaused(paused: boolean) {
        if (paused) {
            this.stopMainLoop();
            TweenMax.pauseAll(TweenMax.getAllTweens());
        } else {
            this.startMainLoop();
            TweenMax.resumeAll(TweenMax.getAllTweens());
        }

        this.paused = paused;
    }
    setEngineActive(active: boolean) {
        if (active) {
            if (this._accelerationTween) {
                this._accelerationTween.kill();
                delete this._accelerationTween;
            }

            this._accelerationTween = TweenMax.to(this, carConfig.accelerationTime, {
                acceleration: carConfig.wheelVelocity,
                ease: "Power3.easeIn",
                onComplete: () => {
                    delete this._accelerationTween;
                },
            });
        } else {
            if (this._accelerationTween) {
                this._accelerationTween.kill();
                delete this._accelerationTween;
            }

            this._accelerationTween = TweenMax.to(this, carConfig.accelerationTime, {
                acceleration: 0,
                ease: "Power3.easeOut",
                onComplete: () => {
                    delete this._accelerationTween;
                },
            });
        }

        this.engineActive = active;
    }
    setBreakActive(active: boolean) {
        if (active) {
            if (this._accelerationTween) {
                this._accelerationTween.kill();
                delete this._accelerationTween;
            }

            this._accelerationTween = TweenMax.to(this, carConfig.decelerationTime, {
                acceleration: -carConfig.wheelVelocity / 2,
                ease: "Power3.easeOut",
                onComplete: () => {
                    delete this._accelerationTween;
                },
            });
        } else {
            if (this._accelerationTween) {
                this._accelerationTween.kill();
                delete this._accelerationTween;
            }

            this._accelerationTween = TweenMax.to(this, carConfig.decelerationTime, {
                acceleration: 0,
                ease: "Power3.easeIn",
                onComplete: () => {
                    delete this._accelerationTween;
                },
            });
        }

        this.breakActive = active;
    }
    setGroundSkin(name) {
        if (!config.groundSkins[name]) name = "forest";

        let modules = this.modules;

        let data = config.groundSkins[name];
        let texture = this.laodTexture(data.texture);

        // Always use the naming convention regardless of what's in the config
        // This ensures we use dirt_a_n.png instead of bumps/dirt_a.png
        let normalMap = this.loadNormalMap(data.texture);

        // Load emission map if available using the _e naming convention
        let emissionMap = this.loadEmissionMap(data.texture);

        if (texture) {
            texture.flipY = false;
            // Configure texture for mirrored tiling
            texture.wrapS = RepeatWrapping; // Standard repeat horizontally
            texture.wrapT = MirroredRepeatWrapping; // Mirrored repeat vertically
            texture.repeat.set(1, 1); // Define tile repetition (adjust values as needed)
        }

        if (normalMap) {
            normalMap.flipY = false;
            // Configure normal map with same wrapping mode as the texture
            normalMap.wrapS = RepeatWrapping;
            normalMap.wrapT = MirroredRepeatWrapping;
            normalMap.repeat.set(1, 1);
        }

        modules.ground.currentGroundTexture = texture;
        modules.ground.currentGroundNormalMap = normalMap;
        modules.ground.currentGroundEmissionMap = emissionMap;
        modules.ground.currentGroundNormalScale = 1;

        forEach(modules.chunks, (chunk) => {
            if (chunk && chunk.mesh) {
                // When changing environments, recreate the material from scratch
                // instead of modifying existing material to ensure consistent appearance
                let newMaterial = new MeshStandardMaterial({
                    map: texture,
                    normalMap: normalMap,
                    emissiveMap: emissionMap, // Add emission map if available
                    emissive: emissionMap ? new Color(0xffffff) : new Color(0x000000), // White for full emission
                    emissiveIntensity: emissionMap ? 3.0 : 0.0, // Higher intensity (3.0) for more noticeable glow
                    metalness: 0, // Non-metallic (organic material)
                    roughness: 1.0, // Completely rough/matte
                    side: DoubleSide,
                });

                // Replace the material
                chunk.mesh.material = newMaterial;
                chunk.mesh.material.needsUpdate = true;
            }
        });

        let greeneryData = data.greenery;
        let greeneryTexture = this.laodTexture(greeneryData.texture);

        // Always use the naming convention for normal maps
        let greeneryNormalMap = this.loadNormalMap(greeneryData.texture);

        // Load emission map for greenery if available
        let greeneryEmissionMap = this.loadEmissionMap(greeneryData.texture);

        // Normalize the scale for normal maps - apply consistent scaling
        let rawGreeneryScale = greeneryData.bumpScale || 1.0;
        let greeneryNormalScale = Math.min(rawGreeneryScale, 3.0); // Cap at 3.0 maximum for greenery

        // Configure greenery textures with mirrored tiling
        if (greeneryTexture) {
            greeneryTexture.wrapS = RepeatWrapping; // Standard repeat horizontally
            greeneryTexture.wrapT = MirroredRepeatWrapping; // Mirrored repeat vertically
            greeneryTexture.repeat.set(1, 1); // Define tile repetition
        }

        if (greeneryNormalMap) {
            greeneryNormalMap.wrapS = RepeatWrapping;
            greeneryNormalMap.wrapT = MirroredRepeatWrapping;
            greeneryNormalMap.repeat.set(1, 1);
        }

        modules.ground.currentGreeneryTexture = greeneryTexture;
        modules.ground.currentGreeneryNormalMap = greeneryNormalMap;
        modules.ground.currentGreeneryEmissionMap = greeneryEmissionMap;
        modules.ground.currentGreeneryNormalScale = greeneryNormalScale;

        forEach(modules.chunks, (chunk) => {
            if (chunk && chunk.greenery) {
                // When changing environments, recreate the greenery material from scratch
                // instead of modifying existing material to ensure consistent appearance
                let newGreeneryMaterial = new MeshStandardMaterial({
                    map: greeneryTexture,
                    normalMap: greeneryNormalMap,
                    emissiveMap: greeneryEmissionMap, // Add emission map if available
                    emissive: greeneryEmissionMap
                        ? new Color(0xffffff)
                        : new Color(0x000000), // White for full emission
                    emissiveIntensity: greeneryEmissionMap ? 3.0 : 0.0, // Higher intensity (3.0) for more noticeable glow
                    metalness: 0, // Non-metallic (plants)
                    roughness: 1.0, // Completely rough/matte
                    side: DoubleSide,
                    transparent: true,
                    alphaTest: 0.5,
                });

                // Replace the material
                chunk.greenery.material = newGreeneryMaterial;
                chunk.greenery.material.needsUpdate = true;
            }
        });

        this.render();
    }
    laodTexture(name, catchErrors = false) {
        let modules = this.modules;

        if (modules.data.textures[name]) return modules.data.textures[name];

        try {
            // Fix path back to original - use res/pics/ instead of /res/img/
            let texture = new TextureLoader().load(`res/pics/${name}`);
            texture.wrapT = RepeatWrapping;
            texture.wrapS = RepeatWrapping;

            // Store successful loads in cache
            modules.data.textures[name] = texture;
            return texture;
        } catch (error) {
            if (!catchErrors) {
                console.warn(`Failed to load texture: ${name}`, error);
            }
            return null;
        }
    }
    // Try to load a normal map based on diffuse texture name
    loadNormalMap(textureName) {
        if (!textureName) return null;

        // Extract the base name without extension
        let baseName = textureName.split(".");
        let extension = baseName.pop();
        baseName = baseName.join(".");

        // Construct normal map name by adding "_n" before the extension
        let normalMapName = baseName + "_n." + extension;

        return this.laodTexture(normalMapName, true);
    }
    /**
     * Try to load an emission map based on diffuse texture name
     * Uses the same pattern as normal maps but with "_e" suffix
     */
    loadEmissionMap(textureName) {
        if (!textureName) return null;

        // Get the file extension
        const dotIndex = textureName.lastIndexOf(".");
        if (dotIndex < 0) return null; // No extension found

        const extension = textureName.substring(dotIndex);
        const baseName = textureName.substring(0, dotIndex);

        // Construct emission map name by adding "_e" before the extension
        let emissionMapName = baseName + "_e" + extension;

        console.log("Looking for emission map:", emissionMapName);

        // Try to load the emission map with error catching
        const emissionMap = this.laodTexture(emissionMapName, true);

        if (emissionMap) {
            console.log("✅ Emission map loaded successfully:", emissionMapName);
            console.log(
                "Emission map URL:",
                emissionMap.image && emissionMap.image.src
                    ? emissionMap.image.src
                    : "No source"
            );
        } else {
            console.log("❌ No emission map found for:", textureName);
        }

        return emissionMap;
    }
    setupDaynight() {
        this.hoursCount = daynight.length;

        // Start from night (second state in daynight.json, index 1)
        this.hour = 1;
        this.setDaytime(this.hour, true);

        // Set up automatic day/night cycle
        this.dayCycleEnabled = true;
        this.dayCycleTimer = 0;
        this.dayCycleDuration = 60; // Seconds for a complete day/night cycle

        // Add key listener for toggling day/night (N key)
        window.addEventListener("keydown", (event) => {
            if (event.key === "n" || event.key === "N") {
                this.toggleDayNight();
            }

            // Add P key to pause/resume the automatic day/night cycle
            if (event.key === "p" || event.key === "P") {
                this.dayCycleEnabled = !this.dayCycleEnabled;
                console.log(
                    `Day/night cycle ${this.dayCycleEnabled ? "enabled" : "disabled"}`
                );
            }
        });

        // Create headlight for the car
        if (!this.modules.lights.headlight) {
            const hourData = daynight[this.hour];
            const headlightConfig = hourData.headlight;

            // Create the headlight
            const headlight = new PointLight(
                headlightConfig.color,
                headlightConfig.intensity,
                headlightConfig.distance
            );
            headlight.name = "headlight";

            // Store headlight offset from config
            this.headlightOffset = new Vector3(
                headlightConfig.offset.x,
                headlightConfig.offset.y,
                headlightConfig.offset.z
            );

            // Add to scene (will be positioned in updateThings)
            this.modules.scene.add(headlight);
            this.modules.lights.headlight = headlight;
        }

        // Commenting out the interval to prevent automatic day/night cycle
        /*
            this.daynightInterval = setInterval( ()=>{
                this.hour++
                this.hour = this.hour % daynight.length
                this.setDaytime( this.hour )
            }, config.daynightHourDuration * 1000 )
            */
    }
    setDaytime(hour: number) {
        let modules = this.modules;
        let hourData = daynight[hour];
        let sun = this.modules.lights.sun;
        let duration = config.daynightHourDuration / 2;
        let bg_uniforms = modules.bg.material.uniforms;

        /*colors*/
        let sunColor = new Color();
        sunColor.setHex(_.cssHex2Hex(hourData.sunColor));
        let skyColor = new Color();
        skyColor.setHex(_.cssHex2Hex(hourData.skyColor));
        let skyColorB = new Color();
        skyColorB.setHex(_.cssHex2Hex(hourData.skyColorB));

        // Initialize sunOffset if it doesn't exist
        if (!this.sunOffset) {
            this.sunOffset = new Vector3(0, 0, 0);
        }

        // Update sunOffset from configuration
        if (hourData.sunOffset) {
            // Animate transition
            TweenMax.to(this.sunOffset, duration, {
                x: hourData.sunOffset.x,
                y: hourData.sunOffset.y,
                z: hourData.sunOffset.z,
                ease: "linear",
            });
        }

        // Update headlight settings if it exists
        if (modules.lights.headlight && hourData.headlight) {
            const headlightConfig = hourData.headlight;

            // Store headlight offset for use in updateThings
            this.headlightOffset = new Vector3(
                headlightConfig.offset.x,
                headlightConfig.offset.y,
                headlightConfig.offset.z
            );

            // Get headlight color
            let headlightColor = new Color();
            headlightColor.setHex(_.cssHex2Hex(headlightConfig.color));

            // Animate headlight property changes
            TweenMax.to(modules.lights.headlight, duration, {
                intensity: headlightConfig.intensity,
                distance: headlightConfig.distance,
                ease: "linear",
            });

            TweenMax.to(modules.lights.headlight.color, duration, {
                r: headlightColor.r,
                g: headlightColor.g,
                b: headlightColor.b,
                ease: "linear",
            });
        }

        // Animate sun property changes
        TweenMax.to(sun.color, duration, {
            r: sunColor.r,
            g: sunColor.g,
            b: sunColor.b,
            ease: "linear",
        });

        TweenMax.to(sun, duration, {
            intensity: hourData.intensity,
            ease: "linear",
        });

        // Animate background uniforms
        TweenMax.to(bg_uniforms.amplitude, duration, {
            value: hourData.amplitude,
            ease: "linear",
        });

        TweenMax.to(bg_uniforms.waves, duration, {
            value: hourData.waves,
            ease: "linear",
        });

        TweenMax.to(bg_uniforms.grid, duration, {
            value: hourData.grid,
            ease: "linear",
        });

        // Animate sky colors
        TweenMax.to(bg_uniforms.diffuse.value, duration, {
            r: skyColor.r,
            g: skyColor.g,
            b: skyColor.b,
            ease: "linear",
        });

        TweenMax.to(bg_uniforms.diffuseB.value, duration, {
            r: skyColorB.r,
            g: skyColorB.g,
            b: skyColorB.b,
            ease: "linear",
        });
    }
    toggleDayNight() {
        // Toggle between day (0) and night (1)
        this.hour = this.hour === 0 ? 1 : 0;

        // Apply the change with animation
        this.setDaytime(this.hour, false);

        // Log the change for debugging
        console.log(
            `Switched to ${this.hour === 0 ? "DAY" : "NIGHT"} mode with sun color: ${daynight[this.hour].sunColor
            }`
        );
    }
    getSpawnPosition(x) {
        let chunkLength = this.chunkLength;
        let chunkIndex = _.nearestMult(x, chunkLength, false, true) / chunkLength;

        let chunk = this.modules.chunks[chunkIndex];

        if (!chunk) {
            this.addChunk(chunkIndex);
            chunk = this.modules.chunks[chunkIndex];
        }

        let count = config.chunkSize;
        let step = config.curve.pointsStep;
        let pointIndex = _.nearestMult(x, step, false, false) / step;
        let pointIndexOffset = chunkIndex * count;

        let point = chunk.points[pointIndex - pointIndexOffset];

        return point ? point.y : -500;
    }
    spawnObject(object, position) {
        Matter.Body.setStatic(object.bodies[0], true);

        this.setBodiesPosition(object.bodies, position);

        Matter.Body.setStatic(object.bodies[0], false);
        this.freezeComposite(object);
    }
    revoke() {
        let car = this.modules.objects.car;
        Matter.Body.setAngularVelocity(car.parts.hanger.matterBody, -0.13);
    }
    respawn() {
        // let car = this.modules.objects.car
        // Matter.Body.setAngularVelocity( car.parts.hanger.matterBody, -0.1 )

        this.spawnObject(this.modules.objects.car.composite, {
            x: carConfig.spawnPosition.x,
            y: this.getSpawnPosition(carConfig.spawnPosition.x) - 100,
        });

        // Reset the day/night cycle to the first (bright) state when respawning
        this.hour = 0; // Set hour to first daynight state (bright daytime)
        this.setDaytime(this.hour, true); // Apply daytime immediately
    }
    setupRenderer() {
        let canvasElement = this.canvas;
        let width = window.innerWidth * DPR;
        let height = window.innerHeight * DPR;

        let scene = new Scene();
        let camera = new PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.001,
            100000
        );
        // let camera = new OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 )
        let renderer = new WebGLRenderer({
            antialias: false,
            canvas: canvasElement,
        });

        renderer.autoClear = false;
        renderer.autoClearColor = false;
        renderer.autoClearDepth = false;
        renderer.autoClearStencil = false;

        let composer = new EffectComposer(renderer);

        camera.rotation.z = Math.PI;
        camera.rotation.y = Math.PI;

        TweenMax.fromTo(
            camera.rotation,
            10,
            {
                z: Math.PI + -Math.PI / 128,
            },
            {
                z: Math.PI + Math.PI / 128,
                repeat: -1,
                yoyo: true,
                ease: "Power1.easeInOut",
            }
        );

        // Create light group for scene-wide lights (not including car headlights)
        let lightGroup = new Group();
        lightGroup.name = "lights";
        scene.add(lightGroup);

        renderer.setClearColor(0xfff17f);

        let groundChunksGroup = new Group();
        let greeneryChunksGroup = new Group();
        groundChunksGroup.name = "ground-chunks";
        greeneryChunksGroup.name = "greenery-chunks";

        // Set ground to z=0 (same as car) for consistent lighting effects
        groundChunksGroup.position.z = 0;
        // Keep greenery at a different z for parallax effect
        greeneryChunksGroup.position.z = 10;
        greeneryChunksGroup.position.y = 20;
        let objectsGroup = new Group();
        objectsGroup.name = "objects";

        scene.add(greeneryChunksGroup);
        scene.add(groundChunksGroup);
        scene.add(objectsGroup);

        this.modules.renderGroups.greenery = greeneryChunksGroup;
        this.modules.renderGroups.objects = objectsGroup;
        this.modules.renderGroups.groundChunks = groundChunksGroup;

        this.modules.scene = scene;
        this.modules.camera = camera;
        this.modules.renderer = renderer;
        this.modules.lightGroup = lightGroup;
        // No longer using pointLight, removed reference
        this.modules.composer = composer;

        this.setupComposer();

        setInterval(() => {
            this.modules.time.x += 0.01;
            this.modules.time.x = this.modules.time.x % 10;
        }, 1000 / 30);
    }
    setupComposer() {
        // Initialize all passes
        let renderPass = new RenderPass(this.modules.scene, this.modules.camera);

        // Color correction for better contrast and vibrancy
        let colorCorPass = new ShaderPass(ColorCorrectionShader);
        colorCorPass.uniforms.powRGB.value = new Vector3(1.1, 1.1, 1.15); // Slightly increase blue for sky
        colorCorPass.uniforms.mulRGB.value = new Vector3(1.2, 1.15, 1.1); // Better contrast

        // Subtle RGB shift for a slight chromatic aberration effect
        let rgbsPass = new ShaderPass(RGBShiftShader);
        rgbsPass.material.uniforms.amount.value = 0.0015; // Reduced from 0.0022 for more subtlety
        rgbsPass.material.uniforms.angle.value = 0.5; // Angle of shift

        // Minimal film grain without strong scanlines
        // Parameters: (noise intensity, scanline intensity, scanline count, grayscale)
        let filmPass = new FilmPass(0.15, 0.1, 480, false); // Reduced scanline intensity from 0.45 to 0.1

        // Almost imperceptible bloom effect
        const bloomParams = {
            strength: 0.05, // Drastically reduced bloom strength
            radius: 0.2, // Very small bloom radius
            threshold: 0.95, // Very high threshold so it barely affects anything
        };
        let bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            bloomParams.strength,
            bloomParams.radius,
            bloomParams.threshold
        );

        // Final copy to screen
        let copyPass = new ShaderPass(CopyShader);
        copyPass.renderToScreen = true;

        // Store all passes for easy reference
        this.modules.fx.passes = {
            renderPass,
            colorCorPass,
            rgbsPass,
            bloomPass,
            filmPass,
            copyPass,
        };

        // Enable/disable post-processing based on fxEnabled state
        _.getter(
            renderPass,
            "renderToScreen",
            () => false,
            () => { }
        );
        _.getter(
            [colorCorPass, rgbsPass, bloomPass, filmPass, copyPass],
            "enabled",
            () => true
        );

        // Add passes in the correct order
        this.modules.composer.addPass(renderPass); // Render the scene
        this.modules.composer.addPass(bloomPass); // Add bloom first
        this.modules.composer.addPass(colorCorPass); // Then correct colors
        this.modules.composer.addPass(rgbsPass); // Add subtle RGB shift
        this.modules.composer.addPass(filmPass); // Add film grain last
        this.modules.composer.addPass(copyPass); // Copy to screen

        // Dynamic day/night effect on bloom strength
        _.getter(bloomPass, "strength", () => {
            // Increase bloom at night for better lighting effects
            if (this.hour >= 18 || this.hour <= 6) {
                return bloomParams.strength * 1.5;
            }
            return bloomParams.strength;
        });
    }
    setupMatterEngine() {
        let modules = this.modules;

        // create an engine
        var engine = Matter.Engine.create({
            positionIterations: 1,
            velocityIterations: 1,
            constraintIterations: 1,
            // enableSleeping: true,
        });

        engine.timing.timeScale = 1;

        // add all of the bodies to the world
        // run the engine
        modules.matter.engine = engine;
        modules.matter.engine.world.gravity.y = config.gravityY;
        // modules.matter.render = render
        // run the renderer
    }
    setupLights() {
        let modules = this.modules;
        let hour = this.hour || 1; // Use current hour or default to night (1)
        let hourData = daynight[hour];

        // Get sun color directly from daynight.json
        let sunColorHex = 0xffffff; // Default white
        if (hourData && hourData.sunColor) {
            // Parse the color correctly from hex string to number
            sunColorHex = _.cssHex2Hex(hourData.sunColor);
            console.log(
                "Setting sun color to:",
                hourData.sunColor,
                "hex:",
                sunColorHex.toString(16)
            );
        }

        // Create directional light with the configured color
        let sun = new DirectionalLight(sunColorHex, 1);

        // Set intensity from config
        sun.intensity = hourData ? hourData.intensity : 1.2;

        // Add a subtle ambient light to soften shadows
        let ambientLight = new AmbientLight(0x3c4a9f, 0.35);

        modules.scene.add(ambientLight);
        modules.scene.add(sun);

        // Store references for later use
        modules.lights.sun = sun;
        modules.lights.ambient = ambientLight;

        // Debug output to verify color is applied
        console.log("Sun light color:", sun.color.getHexString());
    }
    setupBackground() {
        let modules = this.modules;

        // Setup background shader
        let vertShader = require("raw-loader!shaders/bg.vert").default;
        let fragShader = require("raw-loader!shaders/waves.frag").default;
        // let fragShader = require( "raw-loader!shaders/helix.frag" ).default

        let geometry = new PlaneGeometry(1, 1, 1);
        // geometry.translate( height / 2, width / 2, 0 )

        let bg = new Mesh(
            geometry,
            new ShaderMaterial({
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    diffuse: {
                        value: new Color(),
                    },
                    diffuseB: {
                        value: new Color(),
                    },
                    amplitude: {
                        value: 1,
                    },
                    waves: {
                        value: 20,
                    },
                    grid: {
                        value: 5,
                    },
                    camera: {
                        value: modules.camera.position,
                    },
                },
                side: DoubleSide,
                transparent: true,
            })
        );

        modules.bg = bg;

        bg.frustumCulled = false;
        bg.position.z = 1000;

        modules.scene.add(bg);
    }
    startMainLoop() {
        this.prevUpdateDate = +new Date();
        this.renderingActive = true;

        // modules.matter.runner = Engine.run(modules.matter.engine);
        this.onUpdate();
    }
    stopMainLoop() {
        this.renderingActive = false;
        // Matter.Runner.stop( modules.matter.runner )

        cancelAnimationFrame(this._rafId);
    }
    onUpdate() {
        this._rafId = requestAnimationFrame(() => this.onUpdate());

        // How much time has passed since last frame (in ms)
        // Current timestamp in milliseconds
        let now = +new Date();
        let updateTime = now - this.prevUpdateDate;
        this.prevUpdateDate = now;

        this.render()
        this.updateDaycycle(updateTime)
        this.updateThings(updateTime);
        this.updatePhysics(updateTime)
    }
    updateDaycycle(updateTime: number) {
        // Update day/night cycle if enabled
        if (this.dayCycleEnabled && !this.paused) {
            // Convert frameTime from ms to seconds for timer
            const secondsElapsed = updateTime / 1000;

            // Update the day cycle timer
            this.dayCycleTimer += secondsElapsed;

            // Check if it's time to change hour
            if (this.dayCycleTimer >= this.dayCycleDuration / this.hoursCount) {
                // Reset timer
                this.dayCycleTimer = 0;

                // Advance to next hour (cycle through all hours)
                this.hour = (this.hour + 1) % this.hoursCount;

                // Update the daytime with a smooth transition
                this.setDaytime(this.hour, false);
            }
        }
    }
    updatePhysics(updateTime: number) {
        /* engine/break */

        if (this.engineActive || this.breakActive) {
            Matter.Body.setAngularVelocity(
                this.modules.objects.car.parts.wheelA.matterBody,
                this.acceleration
            );
            Matter.Body.setAngularVelocity(
                this.modules.objects.car.parts.wheelB.matterBody,
                this.acceleration
            );
        }

        forEach(this.modules.objects.motos, (moto, name) => {
            Matter.Body.setAngularVelocity(moto.parts.wheelA.matterBody, 0.811);
            Matter.Body.setAngularVelocity(moto.parts.wheelB.matterBody, 0.811);

            if (moto.parts.corpse.matterBody.position.y > 1500) {
                this.spawnObject(moto.composite, {
                    x: this.modules.objects.car.parts.corpse.matterBody.position.x - 659,
                    y:
                        this.getSpawnPosition(
                            this.modules.objects.car.parts.corpse.matterBody.position.x - 659
                        ) - 100,
                });
            }
        });

        /****************/
        forEach(this.modules.objects, (object, name) => {
            forEach(object.parts, (part, name) => {
                part.mesh.position.x = part.matterBody.position.x;
                part.mesh.position.y = part.matterBody.position.y;
                part.mesh.rotation.z = part.matterBody.angle;
            });
        });


        Matter.Engine.update(this.modules.matter.engine, 1000 / 60);

    }
    updateThings(delta) {
        let modules = this.modules;

        let cameraOffset = config.cameraOffset;
        modules.camera.position.y =
            modules.objects.car.parts.wheelA.mesh.position.y + cameraOffset.y;
        modules.camera.position.x =
            modules.objects.car.parts.wheelA.mesh.position.x + cameraOffset.x;

        // Position the single directional light
        // Only update Y and Z coordinates, keep X fixed to maintain consistent lighting direction
        modules.lights.sun.position.set(
            this.sunOffset.x, // Fixed X position - not tied to camera/car movement
            modules.camera.position.y + this.sunOffset.y, // Y position still follows terrain
            modules.camera.position.z * 4 * this.sunOffset.z // Z position for height
        );

        modules.camera.position.z = _.smoothstep(
            config.cameraPosition,
            config.cameraSpeedPosition,
            Math.abs(this.acceleration) / carConfig.wheelVelocity
        );


        // forEach(this.modules.objects.stuff, (object, name) => {
        //     let offset =
        //         (Math.random() > 0.5 ? 2000 : -2000) * (0.5 + Math.random() * 0.5);

        //     if (object.parts.corpse.matterBody.position.y > 1500) {
        //         this.spawnObject(object, {
        //             x:
        //                 this.modules.objects.car.parts.corpse.matterBody.position.x +
        //                 offset,
        //             y:
        //                 this.getSpawnPosition(
        //                     this.modules.objects.car.parts.corpse.matterBody.position.x +
        //                     offset
        //                 ) - 50,
        //         });
        //     }
        // });


        if (this.modules.objects.car.parts.corpse) {
            let chunkLength = this.chunkLength;

            let currentChunkIndex =
                _.nearestMult(
                    this.modules.objects.car.parts.corpse.mesh.position.x,
                    chunkLength,
                    false,
                    true
                ) / chunkLength;

            if (true || currentChunkIndex !== this.currentChunkIndex) {
                this.checkChunks();
            }

            this.currentChunkIndex = currentChunkIndex;

            // Position the headlight relative to the car if it exists
            if (modules.lights.headlight && this.headlightOffset) {
                const carPosition = this.modules.objects.car.parts.corpse.mesh.position;
                const carRotation =
                    this.modules.objects.car.parts.corpse.mesh.rotation.z;

                // Calculate position with offset relative to car's current rotation
                const offsetX = Math.cos(carRotation) * this.headlightOffset.x;
                const offsetY =
                    Math.sin(carRotation) * this.headlightOffset.x +
                    this.headlightOffset.y;

                // Position the headlight
                modules.lights.headlight.position.set(
                    carPosition.x + offsetX,
                    carPosition.y + offsetY,
                    this.headlightOffset.z
                );
            }
        }
    }
    render() {
        // Add safety check to prevent error when composer is not initialized
        if (this.modules && this.modules.composer) {
            this.modules.composer.render();
        } else {
            this.modules.renderer.render(this.modules.scene, this.modules.camera);
        }
    }
    setBodiesPosition(bodies, position) {
        forEach(bodies, (body) => {
            Matter.Body.setPosition(body, position);
        });
    }
    freezeComposite(composite) {
        forEach(composite.bodies, (body) => {
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
        });
    }
    updateSize() {
        let modules = this.modules;

        let canvasElement = this.canvas;

        let width = window.innerWidth * window.devicePixelRatio;
        let height = window.innerHeight * window.devicePixelRatio;

        modules.camera.aspect = width / height;
        modules.size.x = width;
        modules.size.y = height;

        modules.camera.updateProjectionMatrix();
        modules.renderer.setSize(width, height);
        modules.composer.setSize(width, height);

        console.log(`renderer size: ${width} - ${height}`);
    }
    createCar() {
        this.createObject("car", carConfig);
        this.spawnObject(this.modules.objects.car.composite, {
            x: carConfig.spawnPosition.x,
            y: this.getSpawnPosition(carConfig.spawnPosition.x) - 10,
        });
    }
    createObject(objectName: string, config: any, params?: any) {
        let modules = this.modules;
        let spawnX;
        let spawnY;
        let composite;
        let collisionGroup = -1;

        if (params && typeof params.spawnX == "number") {
            spawnX = params.spawnX || 0;
        } else if (config.spawnPosition) {
            spawnX = config.spawnPosition.x || 0;
        } else {
            spawnX = 0;
        }

        if (params && typeof params.spawnY == "number") {
            spawnY = params.spawnY || 0;
        } else if (config.spawnPosition) {
            spawnY = config.spawnPosition.y || 0;
        } else {
            spawnY = 0;
        }

        if (params && typeof params.collisionGroup == "number") {
            collisionGroup = params.collisionGroup;
        } else {
            collisionGroup = config.collisionGroup || 0;
        }

        forEach(config.bodies, (bodyConfig, name) => {
            let geometry;
            let material;
            let matterBody;

            let x = spawnX + (bodyConfig.x || 0);
            let y = spawnY + (bodyConfig.y || 0);

            let zIndex = bodyConfig.zIndex == "number" ? bodyConfig.zIndex : 0;

            modules.objects[objectName] = modules.objects[objectName] || {
                parts: {},
                bodies: [],
            };

            switch (bodyConfig.geometry) {
                case "rectangle":
                    geometry = new PlaneBufferGeometry(
                        bodyConfig.width,
                        bodyConfig.height,
                        1
                    );
                    // geometry.translate( bodyConfig.width/2, 0, 0 )
                    matterBody = Matter.Bodies.rectangle(
                        x,
                        y,
                        bodyConfig.width,
                        bodyConfig.height,
                        {
                            collisionFilter: {
                                group: collisionGroup,
                            },
                            chamfer: {
                                radius: bodyConfig.chamfer || 0,
                            },
                            render: {
                                fillStyle: bodyConfig.color,
                            },
                        }
                    );

                    // Matter.Body.translate( matterBody, { x: -bodyConfig.width / 2, y: 0 } )
                    break;
                case "circle":
                    geometry = new CircleBufferGeometry(bodyConfig.radius, 32);
                    matterBody = Matter.Bodies.circle(
                        x,
                        y,
                        bodyConfig.radius,
                        {
                            collisionFilter: {
                                group: collisionGroup,
                            },
                        },
                        32
                    );
                    break;
            }

            let color = bodyConfig.color;
            let texture;

            if (color) {
                color = _.cssHex2Hex(bodyConfig.color);
            }

            if (bodyConfig.texture) texture = this.laodTexture(bodyConfig.texture);

            // Create basic material properties object
            const materialProps = {
                color,
                map: texture,
                transparent: true,
                metalness: 0.5,
                roughness: 0.5,
                side: DoubleSide,
                shininess: 10, // Lower shininess for less glossy look
                specular: new Color(0x222222), // Reduce specular highlights
                emissive: new Color(0x000000), // Black = no emission by default
                emissiveIntensity: 0.0, // No emission by default
            };

            // Create the material with basic properties
            material = new MeshStandardMaterial(materialProps);

            // Add universal direct emission map loading for all textures
            if (bodyConfig.texture) {
                // Extract the base name and extension
                const dotIndex = bodyConfig.texture.lastIndexOf(".");
                if (dotIndex > 0) {
                    const baseName = bodyConfig.texture.substring(0, dotIndex);
                    const extension = bodyConfig.texture.substring(dotIndex);
                    const emissionMapName = baseName + "_e" + extension;

                    console.log(
                        "🔧 Attempting direct emission map loading for:",
                        emissionMapName
                    );

                    // Create a new texture loader
                    const loader = new TextureLoader();

                    // Load emission map directly for any texture
                    loader.load(
                        "res/pics/" + emissionMapName,
                        // Success callback
                        function (texture) {
                            console.log("✅ DIRECT LOADING SUCCESS for:", emissionMapName);

                            // Match texture settings to main texture
                            if (material.map) {
                                texture.flipY = material.map.flipY;
                                texture.wrapS = material.map.wrapS || RepeatWrapping;
                                texture.wrapT = material.map.wrapT || RepeatWrapping;

                                // Copy UV transformations
                                if (material.map.offset)
                                    texture.offset.copy(material.map.offset);
                                if (material.map.repeat)
                                    texture.repeat.copy(material.map.repeat);
                            }

                            // Apply to material
                            material.emissiveMap = texture;
                            material.emissive.setRGB(1, 1, 1); // Pure white for maximum emission
                            material.emissiveIntensity = 25.0; // Very high intensity
                            material.needsUpdate = true;
                            texture.needsUpdate = true;

                            // Adjust material properties for better emission visibility
                            material.metalness = 0.1; // Lower metalness helps emission show better
                        },
                        // Progress callback
                        undefined,
                        // Error callback - silently fail for files that don't exist
                        function (err) { }
                    );
                }
            }

            if (texture && typeof bodyConfig.textureFlip == "boolean") {
                material.map.flipY = !bodyConfig.textureFlip;
                material.map.needsUpdate = true;
            }

            // Always use the naming convention for normal maps
            let normalMap = null;

            // Check for emission map with _e suffix
            let emissionMap = null;

            if (bodyConfig.texture) {
                console.log(
                    "LOADING TEXTURES FOR:",
                    bodyConfig.texture,
                    "PART:",
                    bodyConfig.name || "unnamed"
                );

                normalMap = this.loadNormalMap(bodyConfig.texture);
                emissionMap = this.loadEmissionMap(bodyConfig.texture);

                // Log detailed emission map status for debugging
                if (emissionMap) {
                    console.log(
                        "✓✓✓ SUCCESSFUL EMISSION MAP LOAD for",
                        bodyConfig.name || "unnamed part"
                    );
                    console.log("    - Texture source:", bodyConfig.texture);
                    console.log("    - Has image:", emissionMap.image ? "YES" : "NO");
                    console.log(
                        "    - Is valid texture:",
                        emissionMap instanceof Texture ? "YES" : "NO"
                    );
                } else {
                    console.log(
                        "✗✗✗ NO EMISSION MAP for",
                        bodyConfig.name || "unnamed part",
                        "texture:",
                        bodyConfig.texture
                    );
                }
            }

            if (normalMap) {
                _.getter(material, "normalMap", () => {
                    return normalMap;
                });

                if (typeof bodyConfig.textureFlip == "boolean") {
                    normalMap.flipY = !bodyConfig.textureFlip;
                    normalMap.needsUpdate = true;
                }
            }

            if (typeof bodyConfig.opacity == "number") {
                material.opacity = bodyConfig.opacity;
            }

            let mesh = new Mesh(geometry, material);
            mesh.position.z = zIndex;

            if (bodyConfig.scale) {
                mesh.scale.x = bodyConfig.scale.x;
                mesh.scale.y = bodyConfig.scale.y;
            }

            matterBody.restitution =
                typeof bodyConfig.restitution == "number"
                    ? bodyConfig.restitution
                    : 0.01;
            matterBody.frictionAir =
                typeof bodyConfig.frictionAir == "number"
                    ? bodyConfig.frictionAir
                    : 0.001;
            matterBody.friction =
                typeof bodyConfig.friction == "number" ? bodyConfig.friction : 0.2;

            if (typeof bodyConfig.density == "number") {
                Matter.Body.setDensity(matterBody, bodyConfig.density);
            }

            if (typeof bodyConfig.mass == "number") {
                Matter.Body.setMass(matterBody, bodyConfig.mass);
            }

            if (typeof bodyConfig.angle == "number") {
                Matter.Body.setAngle(matterBody, bodyConfig.angle);
            }

            if (typeof bodyConfig.static == "boolean") {
                Matter.Body.setStatic(matterBody, bodyConfig.static);
            }

            modules.objects[objectName].parts[name] = {
                mesh,
                matterBody,
            };

            modules.objects[objectName].bodies.push(matterBody);

            modules.renderGroups.objects.add(mesh);

            if (!config.composite) {
                Matter.World.add(modules.matter.engine.world, [matterBody]);
            }
        });

        if (config.composite) {
            composite = Matter.Composite.create({});

            forEach(config.bodies, (bodyConfig, name) => {
                let bodyA = modules.objects[objectName].parts[name].matterBody;

                Matter.Composite.add(composite, [bodyA]);

                if (bodyConfig.constraint) {
                    let constraint = bodyConfig.constraint;
                    let bodyA = modules.objects[objectName].parts[name].matterBody;
                    let bodyB = modules.objects[objectName].parts[constraint.body]
                        ? modules.objects[objectName].parts[constraint.body].matterBody
                        : undefined;

                    Matter.Composite.add(
                        composite,
                        Matter.Constraint.create({
                            bodyA,
                            bodyB,
                            pointA: constraint.pointA,
                            pointB: constraint.pointB,
                            stiffness:
                                typeof constraint.stiffness == "number"
                                    ? constraint.stiffness
                                    : 1,
                            length:
                                typeof constraint.length == "number" ? constraint.length : 1,
                        })
                    );
                }

                if (bodyConfig.constraints) {
                    forEach(bodyConfig.constraints, (constraint, index) => {
                        let bodyA = modules.objects[objectName].parts[name].matterBody;
                        let bodyB = modules.objects[objectName].parts[constraint.body]
                            ? modules.objects[objectName].parts[constraint.body].matterBody
                            : undefined;

                        Matter.Composite.add(
                            composite,
                            Matter.Constraint.create({
                                bodyA,
                                bodyB,
                                pointA: constraint.pointA,
                                pointB: constraint.pointB,
                                stiffness:
                                    typeof constraint.stiffness == "number"
                                        ? constraint.stiffness
                                        : 1,
                                length:
                                    typeof constraint.length == "number" ? constraint.length : 1,
                            })
                        );
                    });
                }
            });

            modules.objects[objectName].composite = composite;
            Matter.World.add(modules.matter.engine.world, [composite]);
        }

        return modules.objects[objectName];
    }
    generatePoints(chunkIndex) {
        // Get configuration values
        let count = config.chunkSize;
        let start = chunkIndex * count;
        let points = [];
        let index = 0;
        let step = config.curve.pointsStep;

        // Global seed to ensure consistent terrain across all chunks
        // This makes the entire world determined by a single global seed
        const GLOBAL_SEED = 6289371;

        // Deterministic noise function that depends on position
        // We use a simple but effective pseudo-random noise function
        let globalNoise = (x, amplitude = 1, frequency = 1) => {
            // Use a combination of sine waves with different frequencies
            // This creates a continuous noise pattern
            return (
                amplitude *
                (Math.sin(x * 0.01 * frequency + GLOBAL_SEED * 0.1) * 0.5 +
                    Math.sin(x * 0.02 * frequency + GLOBAL_SEED * 0.2) * 0.3 +
                    Math.sin(x * 0.04 * frequency + GLOBAL_SEED * 0.3) * 0.2)
            );
        };

        // Reduced terrain feature magnitudes to avoid distorting trees
        // Use global position rather than chunk-relative features for seamless transitions
        const FEATURE_SCALE = 0.5; // Scale down all feature sizes

        // Generate base points
        for (let a = start; a <= start + count; a++) {
            index = points.length;
            let globalPos = a; // Use global position for seamless features

            points.push({
                x: a * step,
                y: 0,
            });

            // Apply standard sinusoid terrain with reduced magnitude
            forEach(config.curve.sinMap, (tuple) => {
                if ((points[index].x / step) % tuple[3] === 0) {
                    // Reduce magnitude by 30% to make terrain less extreme
                    let magnitude = tuple[1] * 0.7;
                    points[index].y +=
                        Math.pow(Math.sin(a / tuple[0]), tuple[2]) * magnitude;
                }
            });

            // Determine terrain features based on global position, not chunk index
            // This ensures seamless transitions between chunks

            // Add gentler jumps every 1000 units
            if (Math.abs(globalPos % 1000) < 50) {
                let distanceFromJump = Math.abs((globalPos % 1000) - 25);
                if (distanceFromJump < 20) {
                    // Gentle hill-like jump with limited height
                    let jumpShape = Math.cos(distanceFromJump * (Math.PI / 20));
                    points[index].y += jumpShape * 40 * FEATURE_SCALE;
                }
            }

            // Small, gentle bumps for more interesting terrain
            // Combine several sine waves with different frequencies
            let bumps = globalNoise(globalPos * 0.5, 15, 1.5) * FEATURE_SCALE;
            points[index].y += bumps;

            // Add occasional gentle slopes
            if (Math.abs(globalPos % 1500) < 300) {
                let slopePosition = (globalPos % 1500) / 300;
                let slopeIntensity = Math.sin(slopePosition * Math.PI) * 0.3;
                points[index].y +=
                    slopeIntensity * ((globalPos % 3000) - 1500) * 0.05 * FEATURE_SCALE;
            }
        }

        return points;
    }
    checkChunks() {
        let currentChunkIndex = this.currentChunkIndex;
        let modules = this.modules;

        let prevChunkIndex = currentChunkIndex - 1;
        let nextChunkIndex = currentChunkIndex + 1;

        this.addChunk(currentChunkIndex);
        this.addChunk(prevChunkIndex);
        this.addChunk(nextChunkIndex);

        forEach(this.modules.activeChunks, (active, chunkIndex) => {
            if (active) {
                if (
                    chunkIndex != currentChunkIndex &&
                    chunkIndex != prevChunkIndex &&
                    chunkIndex != nextChunkIndex
                ) {
                    this.hideChunk(chunkIndex);
                }
            }
        });
    }
    hideChunk(chunkIndex, remove) {
        if (!this.modules.activeChunks[chunkIndex]) {
            return;
        } else {
            delete this.modules.activeChunks[chunkIndex];

            this.modules.renderGroups.groundChunks.remove(
                this.modules.chunks[chunkIndex].mesh
            );
            this.modules.renderGroups.greenery.remove(
                this.modules.chunks[chunkIndex].greenery
            );

            if (remove) {
                this.modules.chunks[chunkIndex].mesh.geometry.kill();
                this.modules.chunks[chunkIndex].greenery.geometry.kill();
            }

            if (this.modules.chunks[chunkIndex].matterBody) {
                Matter.Composite.remove(this.modules.matter.engine.world, [
                    this.modules.chunks[chunkIndex].matterBody,
                ]);
                // Matter.Composite.remove( this.modules.matter.world, [ y ] )
                // this.modules.matter.world.remove( this.modules.chunks[ chunkIndex ].matterBod )
            }

            if (remove) {
                delete this.modules.chunks[chunkIndex];
            }
        }
    }
    showChunk(chunkIndex) {
        if (this.modules.activeChunks[chunkIndex]) {
            return;
        } else {
            this.modules.activeChunks[chunkIndex] = true;
            this.modules.renderGroups.groundChunks.add(
                this.modules.chunks[chunkIndex].mesh
            );
            this.modules.renderGroups.greenery.add(
                this.modules.chunks[chunkIndex].greenery
            );
            Matter.World.add(this.modules.matter.engine.world, [
                this.modules.chunks[chunkIndex].matterBody,
            ]);
        }
    }
    addChunk(chunkIndex) {
        if (this.modules.chunks[chunkIndex]) {
            this.showChunk(chunkIndex);
            return;
        }

        let points = this.generatePoints(chunkIndex);
        let modules = this.modules;

        let groundGeometry = new ChunkBufferGeometry({
            points,
            textureSize: config.groundTextureSize,
            pointsStep: config.curve.pointsStep,
            textureUVYScale: config.groundTextureUVYScale,
            groundHeight: config.groundHeight,
            normalZ: 1,
        });

        // Always create a new material for consistency with environment switching
        // Don't use cached materials since they may have outdated textures
        let groundMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            color: _.cssHex2Hex(config.groundColor),
            map: modules.ground.currentGroundTexture, // Current texture from active environment
            normalMap: modules.ground.currentGroundNormalMap,
            transparent: true,
            metalness: 0, // Non-metallic (organic material)
            roughness: 1.0, // Completely rough/matte
        });

        let groundMesh = new Mesh(groundGeometry, groundMaterial);
        modules.renderGroups.groundChunks.add(groundMesh);

        let matterBody = this.generateCurveMatterBody(points);

        matterBody.friction = config.groundFriction;
        matterBody.restitution = config.groundRestirution;
        matterBody.frictionAir = config.groundFrictionAir;

        Matter.World.add(modules.matter.engine.world, [matterBody]);

        /*greenery*/
        let greeneryGeometry = new ChunkBufferGeometry({
            points,
            textureSize: config.greeneryTextureSize,
            pointsStep: config.curve.pointsStep,
            textureUVYScale: config.greeneryTextureUVYScale,
            groundHeight: -config.greeneryHeight,
            normalZ: -1,
        });

        // Always create a fresh material for greenery to ensure consistent appearance
        let greeneryMaterial = new MeshStandardMaterial({
            map: modules.ground.currentGreeneryTexture,
            normalMap: modules.ground.currentGreeneryNormalMap,
            side: DoubleSide,
            transparent: true,
            alphaTest: 0.5, // Needed for proper transparency in plants
            metalness: 0, // Non-metallic (plants)
            roughness: 1.0, // Completely rough/matte
        });

        // Don't store for reuse - we want fresh materials for consistent appearance
        // modules.data.greeneryMaterial = greeneryMaterial

        let greeneryMesh = new Mesh(greeneryGeometry, greeneryMaterial);
        modules.renderGroups.greenery.add(greeneryMesh);

        modules.chunks[chunkIndex] = {
            mesh: groundMesh,
            matterBody,
            points,
            greenery: greeneryMesh,
        };

        modules.activeChunks[chunkIndex] = true;
    }
    fillChunk(chunkIndex) {
        let chunk = this.modules.chunks[chunkIndex];
    }
    generateCurveMatterBody(points) {
        let matterPoints = points.slice();

        let lastPoint = points[points.length - 1];
        let firstPoint = points[0];

        forEachRight(points, (point) => {
            matterPoints.push({
                x: point.x,
                y: config.groundHeight,
            });
        });

        let body = Matter.Bodies.fromVertices(0, 0, matterPoints, {
            isStatic: true,
            render: {
                fillStyle: "#ff0000",
            },
        });

        Matter.Body.translate(body, {
            x: firstPoint.x - body.bounds.min.x,
            y: config.groundHeight - body.bounds.max.y,
        });

        body.restitution = 0;

        // body.static = true

        return body;
    }
}
