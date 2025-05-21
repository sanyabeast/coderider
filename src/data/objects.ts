import { IGameObjectLayout } from "./data";


export const objectsLayout: { [x: string]: IGameObjectLayout } = {
    "can": {
        "composite": false,
        "bodies": {
            "corpse": {
                "texture": "moto_wheel.png",
                "textureFlip": true,
                "geometry": "circle",
                "color": "#ffffff",
                "radius": 5,
                "mass": 0.01,
                "x": -10,
                "y": 0,
                "restitution": 0.8,
                "zIndex": 1,
                "friction": 0,
                "frictionAir": 0.0001,
                "scale": {
                    "x": 2,
                    "y": 2
                }
            }
        }
    },
    "box": {
        "composite": false,
        "bodies": {
            "corpse": {
                "texture": "box.png",
                "textureFlip": true,
                "geometry": "rectangle",
                "width": 6,
                "height": 6,
                "color": "#ffffff",
                "radius": 10,
                "mass": 0.01,
                "x": -10,
                "y": 0,
                "restitution": 0.8,
                "zIndex": 1,
                "friction": 0.001,
                "frictionAir": 0.001,
                "scale": {
                    "x": 2,
                    "y": 2
                }
            }
        }
    },
    "moto": {
        "composite": true,
        "bodies": {
            "hanger": {
                "scale": {
                    "x": 1.1,
                    "y": 1.1
                },
                "geometry": "rectangle",
                "width": 60,
                "height": 4,
                "mass": 2,
                "x": -10,
                "y": 0,
                "zIndex": 1,
                "friction": 0,
                "frictionAir": 0.0,
                "opacity": 0
            },
            "wheelA": {
                "texture": "moto_wheel.png",
                "geometry": "circle",
                "radius": 11,
                "color": "#ff9800",
                "mass": 0.4,
                "constraint": {
                    "body": "hanger",
                    "pointB": {
                        "x": -23,
                        "y": 6
                    },
                    "stiffness": 0.9,
                    "length": 0.07
                },
                "friction": 0.99,
                "restitution": 0.333,
                "x": 0,
                "y": 0
            },
            "corpse": {
                "texture": "moto.png",
                "scale": {
                    "x": 1.1,
                    "y": 1.1
                },
                "textureFlip": true,
                "geometry": "rectangle",
                "width": 60,
                "height": 32,
                "mass": 0.5,
                "x": -10,
                "y": 0,
                "zIndex": 1,
                "friction": 0,
                "frictionAir": 0.0,
                "chamfer": 16,
                "constraints": [
                    {
                        "body": "hanger",
                        "pointB": {
                            "x": -24,
                            "y": 0
                        },
                        "pointA": {
                            "x": -24,
                            "y": 16
                        },
                        "stiffness": 0.333,
                        "length": 3
                    },
                    {
                        "body": "hanger",
                        "pointB": {
                            "x": 24,
                            "y": 0
                        },
                        "pointA": {
                            "x": 24,
                            "y": 16
                        },
                        "stiffness": 0.333,
                        "length": 3
                    }
                ]
            },
            "wheelB": {
                "texture": "moto_wheel.png",
                "color": "#ff9800",
                "geometry": "circle",
                "radius": 11,
                "mass": 0.4,
                "constraint": {
                    "body": "hanger",
                    "pointB": {
                        "x": 22,
                        "y": 4
                    },
                    "stiffness": 0.9,
                    "length": 0.07
                },
                "friction": 0.99,
                "restitution": 0.11,
                "x": 37,
                "y": 0
            }
        }
    },
    "truck": {
        "composite": true,
        "bodies": {
            "hanger": {
                "scale": {
                    "x": 1.1,
                    "y": 1.1
                },
                "geometry": "rectangle",
                "color": "#ffffff",
                "width": 100,
                "height": 4,
                "mass": 4,
                "x": -10,
                "y": 0,
                "zIndex": 1,
                "friction": 0,
                "frictionAir": 0.0,
                "opacity": 0
            },
            "corpse": {
                "texture": "truck.png",
                "scale": {
                    "x": 1.1,
                    "y": 1.1
                },
                "textureFlip": true,
                "geometry": "rectangle",
                "color": "#f44336",
                "width": 100,
                "height": 32,
                "mass": 1,
                "x": -10,
                "y": 0,
                "zIndex": 1,
                "friction": 0,
                "frictionAir": 0.0,
                "constraints": [
                    {
                        "body": "hanger",
                        "pointB": {
                            "x": -40,
                            "y": 0
                        },
                        "pointA": {
                            "x": -24,
                            "y": 16
                        },
                        "stiffness": 0.075,
                        "length": 0.001
                    },
                    {
                        "body": "hanger",
                        "pointB": {
                            "x": -0,
                            "y": 0
                        },
                        "pointA": {
                            "x": -0,
                            "y": 16
                        },
                        "stiffness": 0.075,
                        "length": 0.001
                    },
                    {
                        "body": "hanger",
                        "pointB": {
                            "x": 40,
                            "y": 0
                        },
                        "pointA": {
                            "x": 24,
                            "y": 16
                        },
                        "stiffness": 0.075,
                        "length": 0.001
                    }
                ]
            },
            "wheelA": {
                "texture": "truck_wheel.png",
                "geometry": "circle",
                "radius": 8,
                "color": "#ff0000",
                "mass": 0.7,
                "constraint": {
                    "body": "hanger",
                    "pointB": {
                        "x": -35,
                        "y": 7
                    },
                    "stiffness": 0.98,
                    "length": 0.07
                },
                "friction": 0.99,
                "restitution": 0,
                "x": 0,
                "y": 0
            },
            "wheelB": {
                "texture": "truck_wheel.png",
                "geometry": "circle",
                "radius": 8,
                "color": "#ffffff",
                "mass": 0.7,
                "zIndex": 100,
                "constraint": {
                    "body": "hanger",
                    "pointB": {
                        "x": 28,
                        "y": 7
                    },
                    "stiffness": 0.98,
                    "length": 0.07
                },
                "friction": 0.99,
                "restitution": 0,
                "x": 37,
                "y": 0
            }
        }
    }
}

export const carObjectLayout: IGameObjectLayout = {
    "spawnPosition": {
        "x": 1400,
        "y": 438
    },
    "accelerationTime": 0.44,
    "decelerationTime": 0.33,
    "composite": true,
    "wheelVelocity": 0.7,
    "corpseSpeed": 0.1,
    "collisionGroup": -1,
    "bodies": {
        "hanger": {
            "scale": {
                "x": 1.1,
                "y": 1.1
            },
            "geometry": "rectangle",
            "color": "#ffffff",
            "width": 60,
            "height": 4,
            "mass": 4,
            "x": -10,
            "y": 0,
            "zIndex": 1,
            "friction": 0,
            "frictionAir": 0.0,
            "opacity": 0,
            "chamfer": 2
        },
        "corpse": {
            "texture": "caer_body_a.png",

            "scale": {
                "x": 1.1,
                "y": 1.1
            },

            "textureFlip": true,
            "geometry": "rectangle",
            "color": "#ffffff",
            light: {
                color: "#ffffff",
                intensity: 16,
                offset: {
                    x: 64,
                    y: 0,
                    z: -1
                },
                distance: 500,
                decay: 1
            },
            "width": 80,
            "height": 32,
            "mass": 1,
            "x": -10,
            "y": 0,
            "zIndex": 1,
            "friction": 0,
            "frictionAir": 0.0,
            "constraints": [
                {
                    "body": "hanger",
                    "pointB": {
                        "x": -24,
                        "y": 0
                    },
                    "pointA": {
                        "x": -24,
                        "y": 16
                    },
                    "stiffness": 0.075,
                    "length": 0.003
                },
                {
                    "body": "hanger",
                    "pointB": {
                        "x": -0,
                        "y": 0
                    },
                    "pointA": {
                        "x": -0,
                        "y": 16
                    },
                    "stiffness": 0.075,
                    "length": 0.003
                },
                {
                    "body": "hanger",
                    "pointB": {
                        "x": 24,
                        "y": 0
                    },
                    "pointA": {
                        "x": 24,
                        "y": 16
                    },
                    "stiffness": 0.075,
                    "length": 0.003
                }
            ],
            "chamfer": 16
        },
        "wheelA": {
            "texture": "wheel.png",


            "geometry": "circle",
            "radius": 11,
            "color": "#ff0000",
            "mass": 0.7,
            "constraint": {
                "body": "hanger",
                "pointB": {
                    "x": -23,
                    "y": 5
                },
                "stiffness": 0.98,
                "length": 0.07
            },
            "friction": 0.99,
            "restitution": 0,
            "x": 0,
            "y": 0
        },
        "wheelB": {
            "texture": "wheel.png",


            "geometry": "circle",
            "radius": 11,
            "mass": 0.7,
            "zIndex": 100,
            "constraint": {
                "body": "hanger",
                "pointB": {
                    "x": 27,
                    "y": 5
                },
                "stiffness": 0.98,
                "length": 0.07
            },
            "friction": 0.99,
            "restitution": 0,
            "x": 37,
            "y": 0
        }
    }
}
