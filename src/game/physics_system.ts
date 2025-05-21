import Matter from "matter-js";
import { Game } from "./game";
import { config, physicsConfig } from "../data/data";
import { forEach, forEachRight, isBoolean, isNumber } from "lodash-es";;

import decomp from 'poly-decomp'
(window as any).decomp = decomp;


export interface IPhysicBodyProperties {
    friction?: number,
    restitution?: number,
    frictionAir?: number,
    mass?: number,
    density?: number,
    angle?: number
    isStatic?: boolean
}

export enum EPhysicBodyType {
    Rectangle,
    Circle
}

export interface IPhysicBodyParams {
    type: EPhysicBodyType
    x: number
    y: number
    width?: number
    height?: number
    radius?: number
    colGroup?: number
    maxSides?: number
}


export class PhysicsSystem {
    game: Game;
    engine: Matter.Engine;

    constructor(game: Game) {
        this.game = game
        this.setupMatterEngine()
    }

    update(delta: number) {
        Matter.Engine.update(this.engine, delta * 1000);
        // Matter.Engine.update(this.engine, 1000 / 60);
    }

    private setupMatterEngine() {
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
        this.engine = engine;
        this.engine.world.gravity.y = physicsConfig.gravity.y;
        // this.matter.render = render
        // run the renderer
    }

    removeBody(body: Matter.Body) {
        Matter.Composite.remove(this.engine.world, [
            body
        ]);
    }

    addBody(body: Matter.Body) {
        Matter.Composite.add(this.engine.world, [
            body
        ]);
    }

    generateCurvedBody(points, props: IPhysicBodyProperties) {
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

        this.setupBody(body, props)

        return body;
    }

    setupBody(body: Matter.Body, props: IPhysicBodyProperties) {

        if (isNumber(props.friction)) body.friction = props.friction;
        if (isNumber(props.restitution)) body.restitution = props.restitution;
        if (isNumber(props.frictionAir)) body.frictionAir = props.frictionAir;

        if (isNumber(props.mass)) Matter.Body.setMass(body, props.mass);
        if (isNumber(props.density)) Matter.Body.setDensity(body, props.density);
        if (isNumber(props.angle)) Matter.Body.setAngle(body, props.angle);

        if (isBoolean(props.isStatic)) Matter.Body.setStatic(body, props.isStatic);
    }

    setAngularVelocity(body: Matter.Body, velocity: number) {
        Matter.Body.setAngularVelocity(
            body,
            velocity
        );
    }

    setVelocity(body: Matter.Body, velocity: Matter.Vector) {
        Matter.Body.setVelocity(
            body,
            velocity
        );
    }

    setStatic(body: Matter.Body, isStatic: boolean) {
        Matter.Body.setStatic(body, isStatic);
    }

    setBodiesPosition(bodies: Matter.Body[], position: Matter.Vector) {
        forEach(bodies, (body) => {
            Matter.Body.setPosition(body, position);
        });
    }

    setBodyPosition(body: Matter.Body, position: Matter.Vector) {
        Matter.Body.setPosition(body, position);
    }

    createBody(params: IPhysicBodyParams, props?: IPhysicBodyProperties): Matter.Body {
        let body: Matter.Body

        switch (params.type) {
            case EPhysicBodyType.Circle: {
                body = Matter.Bodies.circle(
                    params.x,
                    params.y,
                    params.radius,
                    {
                        collisionFilter: {
                            group: params.colGroup,
                        },
                    },
                    32
                );
                break
            }
            case EPhysicBodyType.Rectangle: {
                body = Matter.Bodies.rectangle(
                    params.x,
                    params.y,
                    params.width,
                    params.height,
                    {
                        collisionFilter: {
                            group: params.colGroup,
                        },
                        // chamfer: {
                        //     radius: bodyConfig.chamfer || 0,
                        // },
                    }
                );
                break
            }
        }

        if (props) {
            this.setupBody(body, props);
        }

        return body
    }

    createComposite(): Matter.Composite {
        return Matter.Composite.create({})
    }

    addToComposite(composite: Matter.Composite, object: any): Matter.Composite {
        Matter.Composite.add(composite, object)
        return composite
    }


    freezeComposite(composite: Matter.Composite) {
        forEach(composite.bodies, (body) => {
            this.setVelocity(body, { x: 0, y: 0 });
            this.setAngularVelocity(body, 0);
        });
    }

    createConstraint(
        bodyA: Matter.Body,
        bodyB: Matter.Body,
        pointA: Matter.Vector,
        pointB: Matter.Vector,
        stiffness?: number,
        length?: number
    ): Matter.Constraint {
        return Matter.Constraint.create({
            bodyA,
            bodyB,
            pointA: pointA,
            pointB: pointB,
            stiffness: isNumber(stiffness) ? stiffness : 1,
            length: isNumber(length) ? length : 1
        });
    }


    public spawnObject(object, position) {
        this.setStatic(object.bodies[0], true);
        this.setBodiesPosition(object.bodies, position);
        this.setStatic(object.bodies[0], false);
        this.freezeComposite(object);
    }

}