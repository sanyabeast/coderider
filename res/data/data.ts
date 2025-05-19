// Centralized config exports
import cameraConfigJson from './config/camera.json';
import physicsConfigJson from './config/physics.json';
import renderingConfigJson from './config/rendering.json';
import terrainConfigJson from './config/terrain.json';

// Environment configs
import daynightJson from './environment/daynight.json';
import forestLandscapeJson from './environment/landscapes/forest.json';
import stonesLandscapeJson from './environment/landscapes/stones.json';
import desertLandscapeJson from './environment/landscapes/desert.json';

// Entity configs
import carJson from './entities/car.json';
import objectsJson from './entities/objects.json';

// UI configs

export const cameraConfig = cameraConfigJson;
export const physicsConfig = physicsConfigJson;
export const renderingConfig = renderingConfigJson;
export const terrainConfig = terrainConfigJson;
export const daynight = daynightJson;
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

