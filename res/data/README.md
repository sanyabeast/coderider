# CodeRider Configuration System

This directory contains the configuration files for the CodeRider project. The configuration has been refactored to improve organization, maintainability, and ease of future expansion.

## Directory Structure

```
res/data/
├── config/            # Core configuration settings
│   ├── camera.json    # Camera-related settings
│   ├── physics.json   # Physics simulation settings
│   ├── rendering.json # Rendering settings
│   └── terrain.json   # Ground & environment settings
├── entities/          # Game objects
│   ├── car.json       # Main car configuration
│   └── objects.json   # Other game objects
├── environment/       # Environment settings
│   ├── daynight.json  # Day/night cycle settings
│   └── landscapes/    # Different terrain types
│       ├── desert.json
│       ├── forest.json
│       └── stones.json
├── ui/                # User interface
│   └── localization.json
└── index.js           # Centralized import/export system
```

## Backward Compatibility

The `index.js` file provides backward compatibility with the original configuration structure, allowing existing code to work without major changes. It merges the separate config files into a structure that matches the original format.

## How to Use

### For New Code

Import specific config modules:

```javascript
import { cameraConfig, physicsConfig, terrainConfig } from 'data/index.js';
```

### For Existing Code

The original import style is maintained through the index.js:

```javascript
import { config, daynight, objects, car } from 'data/index.js';
```

## Future Enhancements

This refactoring allows for easier future extensions such as:

1. Adding new vehicle types under entities/
2. Creating more landscape types under environment/landscapes/
3. Adding localization support under ui/
4. Implementing level configurations
