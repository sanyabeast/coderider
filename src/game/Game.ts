import {
    CircleGeometry,
    Color,
    Texture,
    DoubleSide,
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
    PointLight,
} from "three";
import AudioSystem from "./audio_system";

import { daycycleConfig, cameraConfig } from "../data/data";
import { forEach, isNumber } from "lodash-es";;
import { TerrainGenerator as TerrainManager } from "./terrain_manager";
import { ERenderGroup, RenderingSystem } from "./rendering_system";
import { cssHex2Hex, forEachAsync, nearestMult, lerp, moveTo, lerpColor, lerpV3, makeGetter } from "@/Helpers";
import { EPhysicBodyType, PhysicsSystem as PhysicsSystem } from "./physics_system";
import { carObjectLayout, objectsLayout } from "@/data/objects";
import { Ticker } from "./ticker";


export class Game {
    private rootElement: HTMLElement;

    public renderingSystem: RenderingSystem
    public audioSystem: AudioSystem = new AudioSystem()
    public physicsSystem: PhysicsSystem
    public terrainManager: TerrainManager;
    public ticker: Ticker

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

    car = {
        parts: {},
    }

    get acceleration(): number {
        return this.forwardAcceleration - this.backwardAcceleration
    }

    constructor(rootElement: HTMLElement, canvas: HTMLCanvasElement) {
        this.rootElement = rootElement;
        this.ticker = new Ticker(this.onUpdate.bind(this), this.onFixedUpdate.bind(this))
        this.terrainManager = new TerrainManager(this);
        this.renderingSystem = new RenderingSystem(this, { canvas })
        this.physicsSystem = new PhysicsSystem(this)

        this.initialize()
        this.rootElement.focus();

    }

    public setPaused(paused: boolean) {
        this.ticker.setRunning(!paused)
        this.paused = paused;
    }

    public setEngineActive(active: boolean) {
        this.targetForwardAcceleration = active ? carObjectLayout.wheelVelocity : 0
    }

    public setBreakActive(active: boolean) {
        this.targetbackwardAcceleration = active ? carObjectLayout.wheelVelocity / 2 : 0
    }

    public revoke() {
        let car = this.gameObjects.car;
        this.physicsSystem.setAngularVelocity(car.parts.hanger.physicBody, -0.13);
    }

    public respawn() {
        // let car = this.objectsLayout.car
        // this.physicsSystem.setAngularVelocity( car.parts.hanger.physicBody, -0.1 )

        this.physicsSystem.spawnObject(this.gameObjects.car.composite, {
            x: carObjectLayout.spawnPosition.x,
            y: this.terrainManager.getSpawnPosition(carObjectLayout.spawnPosition.x) - 100,
        });

    }

    private async initialize() {
        await this.terrainManager.initializeTerrainChunks();
        await this.initializeGameObjects();

        this.ticker.setRunning(true)
    }

    private onUpdate(delta: number, factor: number) {
        this.renderingSystem.update(delta, factor)
        this.updateValues(delta, factor)
        // this.updatePhysics(delta)
        this.physicsSystem.update(delta)
    }

    private onFixedUpdate(delta: number, factor: number) { }

    private updateValues(delta: number, factor: number) {
        this.forwardAcceleration = moveTo(this.forwardAcceleration, this.targetForwardAcceleration, 1 * delta);
        this.backwardAcceleration = moveTo(this.backwardAcceleration, this.targetbackwardAcceleration, 1 * delta);

        // camera
        let cameraOffset = cameraConfig.offset;
        this.renderingSystem.camera.position.y =
            this.gameObjects.car.parts.wheelA.mesh.position.y + cameraOffset.y;
        this.renderingSystem.camera.position.x =
            this.gameObjects.car.parts.wheelA.mesh.position.x + cameraOffset.x;

        this.renderingSystem.camera.position.z = lerp(
            cameraConfig.position,
            cameraConfig.speedPosition,
            Math.abs(this.acceleration)
        );

        // rest
        /* engine/break */

        this.physicsSystem.setAngularVelocity(
            this.gameObjects.car.parts.wheelA.physicBody,
            this.acceleration
        );
        this.physicsSystem.setAngularVelocity(
            this.gameObjects.car.parts.wheelB.physicBody,
            this.acceleration
        );

        forEach(this.gameObjects.motos, (moto, name) => {
            this.physicsSystem.setAngularVelocity(moto.parts.wheelA.physicBody, 0.811);
            this.physicsSystem.setAngularVelocity(moto.parts.wheelB.physicBody, 0.811);

            if (moto.parts.corpse.physicBody.position.y > 1500) {
                this.physicsSystem.spawnObject(moto.composite, {
                    x: this.gameObjects.car.parts.corpse.physicBody.position.x - 659,
                    y: this.terrainManager.getSpawnPosition(
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



        forEach(this.gameObjects.stuff, (object, name) => {
            let offset =
                (Math.random() > 0.5 ? 2000 : -2000) * (0.5 + Math.random() * 0.5);

            if (object.parts.corpse.physicBody.position.y > 1500) {
                this.physicsSystem.spawnObject(object, {
                    x:
                        this.gameObjects.car.parts.corpse.physicBody.position.x +
                        offset,
                    y:
                        this.terrainManager.getSpawnPosition(
                            this.gameObjects.car.parts.corpse.physicBody.position.x +
                            offset
                        ) - 50,
                });
            }
        });


        if (this.gameObjects.car.parts.corpse) {
            this.terrainManager.updateActiveChunk(this.gameObjects.car.parts.corpse.mesh.position.x)
        }

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
                config: objectsLayout.can,
                spawnX: 300,
                spawnY: -250
            });
        }

        // Create boxes
        for (let i = 0; i < count; i++) {
            this.gameObjects.stuff[`box${i}`] = await this.createObject({
                objectName: `box${i}`,
                config: objectsLayout.box,
                spawnX: 300,
                spawnY: -250
            });
        }

        // Create motorcycles
        const motoCount = 1;
        for (let i = 0; i < motoCount; i++) {
            this.gameObjects.motos[`moto${i}`] = await this.createObject({
                objectName: `moto${i}`,
                config: objectsLayout.moto,
                spawnX: 300,
                spawnY: -225,
                collisionGroup: -1,
            });
        }
    }

    private async createCar() {
        await this.createObject({
            objectName: "car",
            config: carObjectLayout
        });

        this.physicsSystem.spawnObject(this.gameObjects.car.composite, {
            x: carObjectLayout.spawnPosition.x,
            y: this.terrainManager.getSpawnPosition(carObjectLayout.spawnPosition.x) - 10,
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
                    geometry = new PlaneGeometry(
                        bodyConfig.width,
                        bodyConfig.height,
                        1
                    );
                    break;
                case "circle":
                    geometry = new CircleGeometry(bodyConfig.radius, 32);
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


            if (bodyConfig.light) {
                console.log(bodyConfig.light.color)
                let light = new PointLight(
                    cssHex2Hex(bodyConfig.light.color),
                    bodyConfig.light.intensity,
                    bodyConfig.light.distance,
                    bodyConfig.light.decay
                )

                makeGetter(light, "intensity", () => {
                    return lerp(0, bodyConfig.light.intensity, this.renderingSystem.dayState)
                })

                light.position.set(
                    bodyConfig.light.offset.x,
                    bodyConfig.light.offset.y,
                    bodyConfig.light.offset.z,
                )
                mesh.add(light)
            }


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
}
