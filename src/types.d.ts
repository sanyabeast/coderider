// Type definitions for libraries used in CodeRider

// Import THREE types as a base
import * as THREE from 'three';

// Three.js EffectComposer declarations
declare module 'three_fx/postprocessing/EffectComposer' {
  export default class EffectComposer {
    constructor(renderer: THREE.WebGLRenderer, renderTarget?: THREE.WebGLRenderTarget);

    renderTarget1: THREE.WebGLRenderTarget;
    renderTarget2: THREE.WebGLRenderTarget;
    writeBuffer: THREE.WebGLRenderTarget;
    readBuffer: THREE.WebGLRenderTarget;
    renderToScreen: boolean;
    passes: any[];

    swapBuffers(): void;
    addPass(pass: any): void;
    insertPass(pass: any, index: number): void;
    render(deltaTime?: number): void;
    reset(renderTarget?: THREE.WebGLRenderTarget): void;
    setSize(width: number, height: number): void;
  }
}

// RenderPass declaration
declare module 'three_fx/passes/RenderPass' {
  export default class RenderPass {
    constructor(scene: THREE.Scene, camera: THREE.Camera, overrideMaterial?: THREE.Material, clearColor?: THREE.Color, clearAlpha?: number);

    scene: THREE.Scene;
    camera: THREE.Camera;
    overrideMaterial: THREE.Material;
    clearColor: THREE.Color;
    clearAlpha: number;
    oldClearColor: THREE.Color;
    oldClearAlpha: number;
    enabled: boolean;
    clear: boolean;
    needsSwap: boolean;
    renderToScreen: boolean;

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
  }
}

// ShaderPass declaration
declare module 'three_fx/passes/ShaderPass' {
  export default class ShaderPass {
    constructor(shader: any, textureID?: string);

    textureID: string;
    uniforms: any;
    material: THREE.ShaderMaterial;
    renderToScreen: boolean;
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;
    camera: THREE.Camera;
    scene: THREE.Scene;
    quad: THREE.Mesh;

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
  }
}

// FilmPass declaration
declare module 'three_fx/passes/FilmPass' {
  export default class FilmPass {
    constructor(noiseIntensity?: number, scanlinesIntensity?: number, scanlinesCount?: number, grayscale?: boolean);

    uniforms: any;
    material: THREE.ShaderMaterial;
    camera: THREE.Camera;
    scene: THREE.Scene;
    quad: THREE.Mesh;
    renderToScreen: boolean;
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;

    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
  }
}

// UnrealBloomPass declaration
declare module 'three_fx/passes/UnrealBloomPass' {
  export default class UnrealBloomPass {
    constructor(resolution: THREE.Vector2, strength?: number, radius?: number, threshold?: number);

    renderTargetsHorizontal: THREE.WebGLRenderTarget[];
    renderTargetsVertical: THREE.WebGLRenderTarget[];
    nMips: number;
    renderTargetBright: THREE.WebGLRenderTarget;
    highPassUniforms: any;
    materialHighPassFilter: THREE.ShaderMaterial;
    separableBlurMaterials: THREE.ShaderMaterial[];
    compositeMaterial: THREE.ShaderMaterial;
    bloomTintColors: THREE.Vector3[];
    copyUniforms: any;
    materialCopy: THREE.ShaderMaterial;
    oldClearColor: THREE.Color;
    oldClearAlpha: number;
    basic: THREE.MeshBasicMaterial;
    enabled: boolean;
    needsSwap: boolean;
    renderToScreen: boolean;

    dispose(): void;
    getSeperableBlurMaterial(): THREE.ShaderMaterial;
    getCompositeMaterial(): THREE.ShaderMaterial;
    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
  }
}

// Shader declarations
declare module 'three_fx/shaders/CopyShader' {
  const CopyShader: {
    uniforms: {
      tDiffuse: { value: null };
      opacity: { value: number };
    };
    vertexShader: string;
    fragmentShader: string;
  };
  export default CopyShader;
}

declare module 'three_fx/shaders/RGBShiftShader' {
  const RGBShiftShader: {
    uniforms: {
      tDiffuse: { value: null };
      amount: { value: number };
      angle: { value: number };
    };
    vertexShader: string;
    fragmentShader: string;
  };
  export default RGBShiftShader;
}

declare module 'three_fx/shaders/ColorCorrectionShader' {
  const ColorCorrectionShader: {
    uniforms: {
      tDiffuse: { value: null };
      powRGB: { value: THREE.Vector3 };
      mulRGB: { value: THREE.Vector3 };
    };
    vertexShader: string;
    fragmentShader: string;
  };
  export default ColorCorrectionShader;
}
