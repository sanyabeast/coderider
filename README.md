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
- E: Respawn
- Space: Pause
- N: Toggle day/night
- P: Toggle automatic day/night cycle

## Tech Stack

- Three.js: 3D rendering engine for visual effects
- Vue.js: Frontend framework for UI and state management
- Matter.js: 2D physics engine
- GSAP (TweenMax): Animation library for smooth transitions

## Project Structure

The project uses a modular configuration system:

- `config/`: Core settings (camera, physics, rendering, terrain)
- `entities/`: Game objects (car, objects)
- `environment/`: Environment settings (daynight, landscapes)
- `ui/`: User interface (localization)

## Recent Updates

- Modernized for compatibility with current Node.js versions
- Added dynamic day/night cycle with smooth transitions
- Implemented emission maps for glowing effects (using _e.png naming convention)
- Ground and car positioned at same Z-coordinate for consistent lighting
- English UI translation

## Development

```bash
# Install dependencies
npm install

# Run development server
NODE_OPTIONS=--openssl-legacy-provider npm run dev

# Build for production
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

## Author

- [sanyabeast](https://github.com/sanyabeast)

## License

MIT
