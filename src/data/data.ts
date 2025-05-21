
import { Color, Vector3 } from 'three';

// UI configs


export interface IGameObjectPart {
  texture?: string,
  textureFlip?: boolean
  geometry: string
  color?: string
  radius?: number
  width?: number
  height?: number
  mass?: number
  x: number
  y: number
  restitution?: number
  zIndex?: number
  friction?: number
  frictionAir?: number
  chamfer?: number
  opacity?: number
  constraint?: IGameObjectPartConstraint
  constraints?: IGameObjectPartConstraint[]
  scale?: {
    x: number
    y: number
  }
}

export interface IGameObjectPartConstraint {
  body: string
  pointA?: {
    x: number
    y: number
  }
  pointB: {
    x: number
    y: number
  },
  stiffness: number
  length: number
}

export interface IGameObjectLayout {
  composite: boolean,
  spawnPosition?: {
    x: number,
    y: number
  },
  accelerationTime?: number,
  decelerationTime?: number,
  wheelVelocity?: number,
  corpseSpeed?: number,
  collisionGroup?: number,
  bodies: {
    [x: string]: IGameObjectPart
  }
}

export interface IDaycycleItem {
  sunOffset: Vector3
  sunColor: Color
  skyColorB: Color
  skyColor: Color
  sunIntensity: number
  ambientColor: Color
  ambientIntensity: number
  grid: number
  waves: number
  amplitude: number
  headlight: {
    color: Color
    intensity: number
    distance: number
    offset: Vector3
  }
}

export interface ILandscapeSkin {
  name: string,
  texture: string

  greenery: {
    texture: string
  }
}

export const daycycleConfig: {
  day: IDaycycleItem,
  night: IDaycycleItem
} = {
  day: {
    sunOffset: new Vector3(128, -1024, 1),
    sunColor: new Color(0xffffff),
    skyColorB: new Color(0xcacaca),
    skyColor: new Color(0xbdf8ff),
    sunIntensity: 1,
    grid: 3,
    waves: 14,
    amplitude: 0.4,
    headlight: {
      color: new Color(0xffcc88),
      intensity: 0.5,
      distance: 256,
      offset: new Vector3(32, -5, 0)
    },
    ambientIntensity: 0.5,
    ambientColor: new Color(0xffffff)
  },
  night: {
    sunOffset: new Vector3(0, -128, 1),
    sunColor: new Color(0xc0cdff),
    skyColorB: new Color(0x000000),
    skyColor: new Color(0x111111),
    sunIntensity: 0.25,
    grid: 3,
    waves: 14,
    amplitude: 0.4,
    headlight: {
      color: new Color(0xffcc88),
      intensity: 0.5,
      distance: 256,
      offset: new Vector3(32, -5, 0)
    },
    ambientIntensity: 0.5,
    ambientColor: new Color(0x5749b6)
  }
}

export const cameraConfig = {
  position: -180,
  speedPosition: -240,
  offset: new Vector3(60, 0)
}

export const physicsConfig = {
  ground: {
    friction: 0.888,
    restitution: 0.1,
    frictionAir: 0
  },
  gravity: {
    y: 0.6666
  }
}

export const renderingConfig = {
  sunColor: "#ff9800",
  chunkSize: 50,
  daynightHourDuration: 30
}

export const terrainConfig = {
  groundColor: "#ffffff",
  groundHeight: 2000,
  groundTextureSize: 10,
  groundTextureUVYScale: 7,
  greeneryHeight: 2000,
  greeneryTextureSize: 27,
  greeneryTextureUVYScale: 3.1,
  defaultSkin: "forest",
  curve: {
    pointsStep: 20,
    sinMap: [
      [2.12345, 5.5, 1, 1],
      [5.23456, 20, 1, 1],
      [7.34567, 22, 1, 1],
      [16.34567, 42, 1, 1],
      [21.4567, 23, 2, 1],
      [72.5678, 270, 2, 1],
      [160.5678, 370, 1, 1],
      [400.5678, 570, 1, 1]
    ]
  }
}

// export const forestLandscape = forestLandscapeJson;
// export const stonesLandscape = stonesLandscapeJson;
// export const desertLandscape = desertLandscapeJson;

export const landscapeSkins: { [x: string]: ILandscapeSkin } = {
  forest: {
    name: "Forest",
    texture: "dirt_a.png",
    greenery: {
      texture: "greenery/trees.png"
    }
  },
  stones: {
    name: "Stones",
    texture: "grounds/stones.png",
    greenery: {
      texture: "greenery/stones.png"
    }
  },
  desert: {
    name: "Desert",
    texture: "ground_sand.png",
    greenery: {
      texture: "greenery/desert.png"
    }
  }
}

// Create a merged config that mirrors the old structure for backwards compatibility
export const config = {
  // Terrain settings
  groundColor: terrainConfig.groundColor,
  groundHeight: terrainConfig.groundHeight,
  groundTextureSize: terrainConfig.groundTextureSize,
  groundTextureUVYScale: terrainConfig.groundTextureUVYScale,
  greeneryHeight: terrainConfig.greeneryHeight,
  greeneryTextureSize: terrainConfig.greeneryTextureSize,
  greeneryTextureUVYScale: terrainConfig.greeneryTextureUVYScale,
  groundSkin: terrainConfig.defaultSkin,
  curve: terrainConfig.curve,

  // Landscapes

};

