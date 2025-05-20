import {
    CircleBufferGeometry,
    Color,
    Texture,
    DoubleSide,
    Mesh,
    PlaneBufferGeometry,
    PlaneGeometry,
    ShaderMaterial,
    Vector3,
} from "three";
import AudioSystem from "./AudioSystem";

import { config, objects, carConfig, daycycleConfig } from "../../../res/data/data";
import { forEach, isNumber } from "lodash";
import ChunkBufferGeometry from "./ChunkBufferGeometry";
import { TerrainGenerator } from "./TerrainGenerator";
import { Point } from "./types";
import { ERenderGroup, RenderingSystem } from "./RenderingSystem";
import { Ticker } from "./Ticker";
import { cssHex2Hex, forEachAsync, nearestMult, lerp, moveTo, lerpColor, lerpV3 } from "@/Helpers";
import { EPhysicBodyType, PhysicsSystem as PhysicsSystem } from "./PhysicsSystem";

interface Chunk {
    mesh: Mesh;
    physicBody: Matter.Body;
    points: Point[];
    greenery: Mesh;
}

export class Game {
    private renderingSystem: RenderingSystem
    private audioSystem: AudioSystem = new AudioSystem()
    private physicsSystem: PhysicsSystem
    private ticker: Ticker

    private rootElement: HTMLElement;
    private engineActive: boolean = false;
    private breakActive: boolean = false;

    private currentChunkIndex: number = 0;
    private dayCycleHour: number = 0;
    private sunOffset: Vector3 = new Vector3(0, 0, 0);
    private terrainGenerator: TerrainGenerator;

    public paused: any = false;

    private forwardAcceleration: number = 0;
    private targetForwardAcceleration: number = 0;

    private backwardAcceleration: number = 0;
    private targetbackwardAcceleration: number = 0;

    gameObjects = {
        stuff: null,
        motos: null,
        car: null,
    }

    data: { textures: { [x: string]: Texture } } = {
        textures: {},
    }

    chunks: { [x: string]: Chunk } = {}
    activeChunks: { [key: string]: boolean } = {}

    car = {
        parts: {},
    }

    backgroundMesh: Mesh;

    get chunkLength(): number {
        return config.chunkSize * config.curve.pointsStep;
    }

    get acceleration(): number {
        return this.forwardAcceleration - this.backwardAcceleration
    }

    constructor(rootElement: HTMLElement, canvas: HTMLCanvasElement) {
        this.rootElement = rootElement;
        this.ticker = new Ticker(this.onUpdate.bind(this), this.onFixedUpdate.bind(this))
        this.terrainGenerator = new TerrainGenerator();
        this.renderingSystem = new RenderingSystem(this, { canvas })
        this.physicsSystem = new PhysicsSystem(this)

        this.initialize()
        this.rootElement.focus();

    }

    private async initialize() {
        await this.initializeEnvironment();
        await this.initializeGameObjects();

        this.ticker.setRunning(true)
    }


    private onUpdate(delta: number, factor: number) {
        this.renderingSystem.render()
        this.updateValues(delta, factor)
        this.updateThings(delta, factor);
        // this.updatePhysics(delta)
    }

    private onFixedUpdate(delta: number, factor: number) {
        this.physicsSystem.update(delta)
    }

    private updateValues(delta: number, factor: number) {
        this.dayCycleHour = (this.dayCycleHour + (0.25) * delta) % 1;
        this.forwardAcceleration = moveTo(this.forwardAcceleration, this.targetForwardAcceleration, 1 * delta);
        this.backwardAcceleration = moveTo(this.backwardAcceleration, this.targetbackwardAcceleration, 1 * delta);

        // sun 
        this.renderingSystem.sunLight.intensity = lerp(
            daycycleConfig.day.intensity,
            daycycleConfig.night.intensity,
            this.dayCycleHour
        )

        this.renderingSystem.sunLight.color = lerpColor(
            daycycleConfig.day.sunColor,
            daycycleConfig.night.sunColor,
            this.dayCycleHour
        )

        //  bg
        let bgMaterial: ShaderMaterial = this.backgroundMesh.material as ShaderMaterial

        bgMaterial.uniforms.diffuse.value = lerpColor(
            daycycleConfig.day.skyColor,
            daycycleConfig.night.skyColor,
            this.dayCycleHour
        );

        bgMaterial.uniforms.diffuseB.value = lerpColor(
            daycycleConfig.day.skyColorB,
            daycycleConfig.night.skyColorB,
            this.dayCycleHour
        );
    }

    private updateThings(delta: number, factor: number) {

        let cameraOffset = config.cameraOffset;
        this.renderingSystem.camera.position.y =
            this.gameObjects.car.parts.wheelA.mesh.position.y + cameraOffset.y;
        this.renderingSystem.camera.position.x =
            this.gameObjects.car.parts.wheelA.mesh.position.x + cameraOffset.x;

        // Position the single directional light
        // Only update Y and Z coordinates, keep X fixed to maintain consistent lighting direction
        this.renderingSystem.sunLight.position.set(
            this.sunOffset.x, // Fixed X position - not tied to camera/car movement
            this.renderingSystem.camera.position.y + this.sunOffset.y, // Y position still follows terrain
            this.renderingSystem.camera.position.z * 4 * this.sunOffset.z // Z position for height
        );

        this.renderingSystem.camera.position.z = lerp(
            config.cameraPosition,
            config.cameraSpeedPosition,
            Math.abs(this.acceleration) / carConfig.wheelVelocity
        );

        /* engine/break */

        if (this.engineActive || this.breakActive) {
            this.physicsSystem.setAngularVelocity(
                this.gameObjects.car.parts.wheelA.physicBody,
                this.acceleration
            );
            this.physicsSystem.setAngularVelocity(
                this.gameObjects.car.parts.wheelB.physicBody,
                this.acceleration
            );
        }

        forEach(this.gameObjects.motos, (moto, name) => {
            this.physicsSystem.setAngularVelocity(moto.parts.wheelA.physicBody, 0.811);
            this.physicsSystem.setAngularVelocity(moto.parts.wheelB.physicBody, 0.811);

            if (moto.parts.corpse.physicBody.position.y > 1500) {
                this.spawnObject(moto.composite, {
                    x: this.gameObjects.car.parts.corpse.physicBody.position.x - 659,
                    y: this.getSpawnPosition(
                        this.gameObjects.car.parts.corpse.physicBody.position.x - 659
                    ) - 100,
                });
            }
        });


        /****************/
        forEach(this.gameObjects, (object, name) => {
            forEach(object.parts, (part, name) => {
                part.mesh.position.x = part.physicBody.position.x;
                part.mesh.position.y = part.physicBody.position.y;
                part.mesh.rotation.z = part.physicBody.angle;
            });
        });



        // forEach(this.objects.stuff, (object, name) => {
        //     let offset =
        //         (Math.random() > 0.5 ? 2000 : -2000) * (0.5 + Math.random() * 0.5);

        //     if (object.parts.corpse.physicBody.position.y > 1500) {
        //         this.spawnObject(object, {
        //             x:
        //                 this.objects.car.parts.corpse.physicBody.position.x +
        //                 offset,
        //             y:
        //                 this.getSpawnPosition(
        //                     this.objects.car.parts.corpse.physicBody.position.x +
        //                     offset
        //                 ) - 50,
        //         });
        //     }
        // });


        if (this.gameObjects.car.parts.corpse) {
            let chunkLength = this.chunkLength;

            let currentChunkIndex =
                nearestMult(
                    this.gameObjects.car.parts.corpse.mesh.position.x,
                    chunkLength,
                    false,
                    true
                ) / chunkLength;

            if (true || currentChunkIndex !== this.currentChunkIndex) {
                this.checkChunks();
            }

            this.currentChunkIndex = currentChunkIndex;

        }
    }


    private async initializeEnvironment() {
        // Set up visual environment
        this.setupBackground();

        // Create initial terrain chunks
        await this.initializeTerrainChunks();
    }

    private async initializeTerrainChunks() {
        // Create initial set of chunks (previous, current, next)
        await this.addChunk(-1);
        await this.addChunk(0);
        await this.addChunk(1);
    }

    private async initializeGameObjects() {
        // Initialize object collections
        this.gameObjects.stuff = {};
        this.gameObjects.motos = {};

        // Create props and obstacles
        this.createProps();

        // Create player vehicle
        await this.createCar();
    }

    private async createProps() {
        const count = 5; // Reduced from 15 to minimize random props

        // Create cans
        for (let i = 0; i < count; i++) {
            this.gameObjects.stuff[`can${i}`] = await this.createObject({
                objectName: `can${i}`,
                config: objects.can,
                spawnX: 300,
                spawnY: -250
            });
        }

        // Create boxes
        for (let i = 0; i < count; i++) {
            this.gameObjects.stuff[`box${i}`] = await this.createObject({
                objectName: `box${i}`,
                config: objects.box,
                spawnX: 300,
                spawnY: -250
            });
        }

        // Create motorcycles
        const motoCount = 1;
        for (let i = 0; i < motoCount; i++) {
            this.gameObjects.motos[`moto${i}`] = await this.createObject({
                objectName: `moto${i}`,
                config: objects.moto,
                spawnX: 300,
                spawnY: -225,
                collisionGroup: -1,
            });
        }
    }

    public setPaused(paused: boolean) {
        this.ticker.setRunning(!paused)
        this.paused = paused;
    }

    public setEngineActive(active: boolean) {
        this.targetForwardAcceleration = active ? carConfig.wheelVelocity : 0
        this.engineActive = active;
    }

    public setBreakActive(active: boolean) {
        this.targetbackwardAcceleration = active ? carConfig.wheelVelocity / 2 : 0
        this.breakActive = active;
    }

    private getSpawnPosition(x: number): number {
        const chunkLength = this.chunkLength;
        return this.terrainGenerator.getSpawnPositionY(x, chunkLength);
    }

    private spawnObject(object, position) {
        this.physicsSystem.setStatic(object.bodies[0], true);
        this.physicsSystem.setBodiesPosition(object.bodies, position);
        this.physicsSystem.setStatic(object.bodies[0], false);
        this.physicsSystem.freezeComposite(object);
    }

    public revoke() {
        let car = this.gameObjects.car;
        this.physicsSystem.setAngularVelocity(car.parts.hanger.physicBody, -0.13);
    }

    public respawn() {
        // let car = this.objects.car
        // this.physicsSystem.setAngularVelocity( car.parts.hanger.physicBody, -0.1 )

        this.spawnObject(this.gameObjects.car.composite, {
            x: carConfig.spawnPosition.x,
            y: this.getSpawnPosition(carConfig.spawnPosition.x) - 100,
        });

    }

    private setupBackground() {

        // Create background mesh with shader material
        const bg = this.createBackgroundMesh();

        // Configure background properties
        bg.frustumCulled = false;
        bg.position.z = 1000;

        // Store reference and add to scene
        this.backgroundMesh = bg;
        this.renderingSystem.addToScene(bg);
    }

    private createBackgroundMesh() {
        // Load shader code
        const vertShader = require("raw-loader!shaders/bg.vert").default;
        const fragShader = require("raw-loader!shaders/waves.frag").default;

        // Create simple plane geometry
        const geometry = new PlaneGeometry(1, 1, 1);

        // Create mesh with shader material
        return new Mesh(
            geometry,
            new ShaderMaterial({
                vertexShader: vertShader,
                fragmentShader: fragShader,
                uniforms: {
                    diffuse: { value: new Color() },
                    diffuseB: { value: new Color() },
                    amplitude: { value: 1 },
                    waves: { value: 20 },
                    grid: { value: 5 },
                    camera: { value: this.renderingSystem.camera.position },
                },
                side: DoubleSide,
                transparent: true,
            })
        );
    }

    private async createCar() {
        await this.createObject({
            objectName: "car",
            config: carConfig
        });
        this.spawnObject(this.gameObjects.car.composite, {
            x: carConfig.spawnPosition.x,
            y: this.getSpawnPosition(carConfig.spawnPosition.x) - 10,
        });
    }
    // Define an interface for the object creation parameters
    private async createObject(params: {
        objectName: string;
        config: any;
        spawnX?: number;
        spawnY?: number;
        collisionGroup?: number;
    }) {
        let composite;

        // Extract parameters from the single object parameter
        const { objectName, config } = params;

        // Handle spawn position with fallbacks
        const spawnX = params.spawnX !== undefined ? params.spawnX :
            (config.spawnPosition ? config.spawnPosition.x || 0 : 0);

        const spawnY = params.spawnY !== undefined ? params.spawnY :
            (config.spawnPosition ? config.spawnPosition.y || 0 : 0);

        // Handle collision group with fallbacks
        const collisionGroup = params.collisionGroup !== undefined ?
            params.collisionGroup : (config.collisionGroup || 0);

        await forEachAsync(config.bodies, async (bodyConfig, name) => {
            let geometry;
            let material;
            let physicBody;

            let x = spawnX + (bodyConfig.x || 0);
            let y = spawnY + (bodyConfig.y || 0);

            let zIndex = bodyConfig.zIndex == "number" ? bodyConfig.zIndex : 0;

            this.gameObjects[objectName] = this.gameObjects[objectName] || {
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
                    break;
                case "circle":
                    geometry = new CircleBufferGeometry(bodyConfig.radius, 32);
                    break;
            }

            physicBody = this.physicsSystem.createBody(
                {
                    type: bodyConfig.geometry == "rectangle" ? EPhysicBodyType.Rectangle : EPhysicBodyType.Circle,
                    x,
                    y,
                    radius: bodyConfig.radius,
                    width: bodyConfig.width,
                    height: bodyConfig.height,
                    colGroup: collisionGroup
                },
                {

                    restitution: isNumber(bodyConfig.restitution) ? bodyConfig.restitution : 0.01,
                    frictionAir: isNumber(bodyConfig.frictionAir) ? bodyConfig.frictionAir : 0.001,
                    friction: isNumber(bodyConfig.friction) ? bodyConfig.friction : 0.2,
                    mass: bodyConfig.mass,
                    density: bodyConfig.density,
                    angle: bodyConfig.angle,
                    isStatic: bodyConfig.static
                })

            let color = bodyConfig.color;

            if (color) {
                color = cssHex2Hex(bodyConfig.color);
            }

            // Create the material with basic properties
            console.log(bodyConfig.textureFlip)
            material = await this.renderingSystem.createMaterial(objectName + name, {
                texture: bodyConfig.texture,
                metallic: 0.5,
                roughness: 0.5,
                transparent: true,
                flipY: bodyConfig.textureFlip === false
            });

            let mesh = new Mesh(geometry, material);
            mesh.position.z = zIndex;

            if (bodyConfig.scale) {
                mesh.scale.x = bodyConfig.scale.x;
                mesh.scale.y = bodyConfig.scale.y;
            }

            this.gameObjects[objectName].parts[name] = {
                mesh,
                physicBody,
            };

            this.gameObjects[objectName].bodies.push(physicBody);

            this.renderingSystem.addToRenderGroup(ERenderGroup.Props, mesh)

            if (!config.composite) {
                this.physicsSystem.addBody(physicBody)
            }
        });

        if (config.composite) {
            composite = this.physicsSystem.createComposite();

            await forEachAsync(config.bodies, (bodyConfig, name) => {
                let bodyA = this.gameObjects[objectName].parts[name].physicBody;

                this.physicsSystem.addToComposite(composite, bodyA);

                if (bodyConfig.constraint) {
                    let constraint = bodyConfig.constraint;
                    let bodyA = this.gameObjects[objectName].parts[name].physicBody;
                    let bodyB = this.gameObjects[objectName].parts[constraint.body]
                        ? this.gameObjects[objectName].parts[constraint.body].physicBody
                        : undefined;

                    this.physicsSystem.addToComposite(
                        composite,
                        this.physicsSystem.createConstraint(
                            bodyA,
                            bodyB,
                            constraint.pointA,
                            constraint.pointB,
                            constraint.stiffness,
                            constraint.length,
                        )
                    );
                }

                if (bodyConfig.constraints) {
                    forEach(bodyConfig.constraints, (constraint, index) => {
                        let bodyA = this.gameObjects[objectName].parts[name].physicBody;
                        let bodyB = this.gameObjects[objectName].parts[constraint.body]
                            ? this.gameObjects[objectName].parts[constraint.body].physicBody
                            : undefined;

                        this.physicsSystem.addToComposite(
                            composite,
                            this.physicsSystem.createConstraint(
                                bodyA,
                                bodyB,
                                constraint.pointA,
                                constraint.pointB,
                                constraint.stiffness,
                                constraint.length,
                            )
                        );
                    });
                }
            });

            this.gameObjects[objectName].composite = composite;
            this.physicsSystem.addBody(composite)
        }

        return this.gameObjects[objectName];
    }

    private async checkChunks() {
        let currentChunkIndex = this.currentChunkIndex;

        let prevChunkIndex = currentChunkIndex - 1;
        let nextChunkIndex = currentChunkIndex + 1;

        await this.addChunk(currentChunkIndex);
        await this.addChunk(prevChunkIndex);
        await this.addChunk(nextChunkIndex);

        forEach(this.activeChunks, (active, chunkIndex) => {
            if (active) {
                if (
                    parseInt(chunkIndex) != currentChunkIndex &&
                    parseInt(chunkIndex) != prevChunkIndex &&
                    parseInt(chunkIndex) != nextChunkIndex
                ) {
                    this.hideChunk(parseInt(chunkIndex));
                }
            }
        });
    }

    private hideChunk(chunkIndex: number, remove: boolean = false) {
        if (!this.activeChunks[chunkIndex]) {
            return;
        } else {
            delete this.activeChunks[chunkIndex];

            this.renderingSystem.removeFromRenderGroup(ERenderGroup.Front, this.chunks[chunkIndex].mesh)
            this.renderingSystem.removeFromRenderGroup(ERenderGroup.Back, this.chunks[chunkIndex].greenery)

            if (remove) {
                this.chunks[chunkIndex].mesh.geometry.dispose();
                this.chunks[chunkIndex].greenery.geometry.dispose();
            }

            if (this.chunks[chunkIndex].physicBody) {
                this.physicsSystem.removeBody(this.chunks[chunkIndex].physicBody)
            }

            if (remove) {
                delete this.chunks[chunkIndex];
            }
        }
    }

    private showChunk(chunkIndex) {
        if (this.activeChunks[chunkIndex]) {
            return;
        } else {
            this.activeChunks[chunkIndex] = true;
            this.renderingSystem.addToRenderGroup(ERenderGroup.Front, this.chunks[chunkIndex].mesh)
            this.renderingSystem.addToRenderGroup(ERenderGroup.Back, this.chunks[chunkIndex].greenery)

            this.physicsSystem.addBody(this.chunks[chunkIndex].physicBody)
        }
    }

    private async addChunk(chunkIndex: number) {
        if (this.chunks[chunkIndex]) {
            this.showChunk(chunkIndex);
            return;
        }

        let points = this.terrainGenerator.generatePoints(chunkIndex);

        let groundGeometry = new ChunkBufferGeometry({
            points,
            textureSize: config.groundTextureSize,
            pointsStep: config.curve.pointsStep,
            textureUVYScale: config.groundTextureUVYScale,
            groundHeight: config.groundHeight,
            normalZ: 1,
        });

        let groundMaterial = await this.renderingSystem.createMaterial('ground-material', {
            texture: config.groundSkins.forest.texture,
            transparent: false,
            metallic: 0,
            roughness: 1
        })

        let groundMesh = new Mesh(groundGeometry, groundMaterial);
        this.renderingSystem.addToRenderGroup(ERenderGroup.Front, groundMesh)

        let physicBody = this.physicsSystem.generateCurvedBody(points, {
            friction: config.groundFriction,
            restitution: config.groundRestirution,
            frictionAir: config.groundFrictionAir,
        });


        this.physicsSystem.addBody(physicBody)

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
        let greeneryMaterial = await this.renderingSystem.createMaterial("greenery", {
            texture: config.groundSkins.forest.greenery.texture,
            transparent: true,
            metallic: 0,
            roughness: 1,
            flipY: true
        })
        // Don't store for reuse - we want fresh materials for consistent appearance
        // this.data.greeneryMaterial = greeneryMaterial

        let greeneryMesh = new Mesh(greeneryGeometry, greeneryMaterial);
        this.renderingSystem.addToRenderGroup(ERenderGroup.Back, greeneryMesh)

        this.chunks[chunkIndex] = {
            mesh: groundMesh,
            physicBody: physicBody,
            points,
            greenery: greeneryMesh,
        };

        this.activeChunks[chunkIndex] = true;
    }


}
