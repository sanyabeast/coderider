// Centralized config exports
import cameraConfig from './config/camera.json';
import physicsConfig from './config/physics.json';
import renderingConfig from './config/rendering.json';
import terrainConfig from './config/terrain.json';

// Environment configs
import daynight from './environment/daynight.json';
import forestLandscape from './environment/landscapes/forest.json';
import stonesLandscape from './environment/landscapes/stones.json';
import desertLandscape from './environment/landscapes/desert.json';

// Entity configs
import car from './entities/car.json';
import objects from './entities/objects.json';

// UI configs

// Create a merged config that mirrors the old structure for backwards compatibility
const config = {
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


// Export individual configs and the backward-compatible merged config
export {
  config as default,
  config,
  cameraConfig,
  physicsConfig,
  renderingConfig,
  terrainConfig,
  daynight,
  car,
  objects,
};
