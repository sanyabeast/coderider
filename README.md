# CodeRider

A 2D platformer with dynamic lighting, physics, and visual effects.

[Play online](https://sanyabeast.github.io/coderider/dist/index.html)

## Features

- Physics-based motorcycle gameplay using Matter.js
- Dynamic day/night cycle with smooth transitions
- PBR materials with normal maps and emission maps
- Procedurally generated terrain
- Dynamic lighting with colored sun and ambient light
- Car headlights that adjust based on time of day
- Parallax effect for added depth

## Controls

- A/D or Left/Right arrows: Accelerate and brake
- R: Respawn
- Q: Revoke (reset car position)
- Space: Pause/Resume
- Escape: Close pause menu

## Tech Stack

- Three.js: 3D rendering engine for visual effects
- Vue 3: Frontend framework for UI and state management
- Pinia: State management (replacing Vuex)
- Matter.js: 2D physics engine
- TypeScript: For type safety and better development experience

## Project Structure

The project uses a modular configuration system:

- `config/`: Core settings (camera, physics, rendering, terrain)
- `entities/`: Game objects (car, objects)
- `environment/`: Environment settings (daynight, landscapes)
- `ui/`: User interface (localization)

## Recent Updates

- Migrated from Vue 2 to Vue 3 with Composition API
- Replaced Vuex with Pinia for state management
- Modernized build system with latest Babel and webpack
- Improved keyboard controls for better compatibility with different layouts
- Refined UI with more compact and consistent styling
- Simplified build configuration by removing unnecessary Babel plugins
- Added TypeScript support throughout the codebase

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Note for Node.js compatibility
This project requires the OpenSSL legacy provider flag when using Node.js 17 or higher due to older webpack dependencies. This flag is already included in the npm scripts.

## Author

- [sanyabeast](https://github.com/sanyabeast)

## License

MIT
