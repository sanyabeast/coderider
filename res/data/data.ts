// Centralized config exports
import cameraConfigJson from './config/camera.json';
import physicsConfigJson from './config/physics.json';
import renderingConfigJson from './config/rendering.json';
import terrainConfigJson from './config/terrain.json';

// Environment configs
import forestLandscapeJson from './environment/landscapes/forest.json';
import stonesLandscapeJson from './environment/landscapes/stones.json';
import desertLandscapeJson from './environment/landscapes/desert.json';

// Entity configs
import carJson from './entities/car.json';
import objectsJson from './entities/objects.json';
import { Color, Vector3 } from 'three';

// UI configs

export interface daycycleItem {
  sunOffset: Vector3
  sunColor: Color
  skyColorB: Color
  skyColor: Color
  intensity: number
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

export const daycycleConfig: {
  day: daycycleItem,
  night: daycycleItem
} = {
  day: {
    sunOffset: new Vector3(128, -1024, 1),
    sunColor: new Color(0xffe0b1),
    skyColorB: new Color(0xcacaca),
    skyColor: new Color(0xbdf8ff),
    intensity: 1,
    grid: 3,
    waves: 14,
    amplitude: 0.4,
    headlight: {
      color: new Color(0xffcc88),
      intensity: 0.5,
      distance: 256,
      offset: new Vector3(32, -5, 0)
    }
  },
  night: {
    sunOffset: new Vector3(0, -128, 1),
    sunColor: new Color(0xc0cdff),
    skyColorB: new Color(0x000000),
    skyColor: new Color(0x111111),
    intensity: 0.2,
    grid: 3,
    waves: 14,
    amplitude: 0.4,
    headlight: {
      color: new Color(0xffcc88),
      intensity: 0.5,
      distance: 256,
      offset: new Vector3(32, -5, 0)
    }
  }
}

export const cameraConfig = cameraConfigJson;
export const physicsConfig = physicsConfigJson;
export const renderingConfig = renderingConfigJson;
export const terrainConfig = terrainConfigJson;
export const forestLandscape = forestLandscapeJson;
export const stonesLandscape = stonesLandscapeJson;
export const desertLandscape = desertLandscapeJson;

export const carConfig = carJson;
export const objects = objectsJson;


// Create a merged config that mirrors the old structure for backwards compatibility
export const config = {
  // Camera settings
  cameraPosition: cameraConfig.position,
  cameraSpeedPosition: cameraConfig.speedPosition,
  cameraOffset: cameraConfig.offset,

  // Physics settings
  groundFriction: physicsConfig.ground.friction,
  groundRestirution: physicsConfig.ground.restitution,
  groundFrictionAir: physicsConfig.ground.frictionAir,
  gravityY: physicsConfig.gravity.y,

  // Rendering settings
  sunColor: renderingConfig.sunColor,
  chunkSize: renderingConfig.chunkSize,
  daynightHourDuration: renderingConfig.daynightHourDuration,

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
  groundSkins: {
    forest: forestLandscape,
    stones: stonesLandscape,
    desert: desertLandscape
  }
};

