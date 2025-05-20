// Type definitions for libraries used in CodeRider

// Import THREE types as a base
import * as THREE from 'three';

// GSAP TweenMax declarations
declare module 'gsap/TweenMax' {
  export class TweenMax {
    static to(target: any, duration: number, vars: any): TweenMax;
    static from(target: any, duration: number, vars: any): TweenMax;
    static fromTo(target: any, duration: number, fromVars: any, toVars: any): TweenMax;
    static set(target: any, vars: any): TweenMax;
    static killTweensOf(target: any, onlyActive?: boolean): void;
    static getTweensOf(target: any, onlyActive?: boolean): TweenMax[];
    static getAllTweens(includeTimelines?: boolean): TweenMax[];
    static pauseAll(tweens?: boolean, delayedCalls?: boolean): void;
    static resumeAll(tweens?: boolean, delayedCalls?: boolean): void;
    static killAll(tweens?: boolean, delayedCalls?: boolean, timelines?: boolean): void;

    kill(vars?: any, target?: any): TweenMax;
    pause(atTime?: number): TweenMax;
    resume(fromTime?: number): TweenMax;
    restart(includeDelay?: boolean, suppressEvents?: boolean): TweenMax;
    seek(time: number, suppressEvents?: boolean): TweenMax;
    play(from?: any, suppressEvents?: boolean): TweenMax;
    reverse(from?: any, suppressEvents?: boolean): TweenMax;
    timeScale(value: number): any;
    progress(value: number): any;
    time(value: number, suppressEvents?: boolean): any;
    duration(value: number): any;
    delay(value: number): any;
    invalidate(): TweenMax;
  }

  export function to(target: any, duration: number, vars: any): TweenMax;
  export function from(target: any, duration: number, vars: any): TweenMax;
  export function fromTo(target: any, duration: number, fromVars: any, toVars: any): TweenMax;
  export function set(target: any, vars: any): TweenMax;
  export function killTweensOf(target: any, onlyActive?: boolean): void;
  export function getTweensOf(target: any, onlyActive?: boolean): TweenMax[];
  export function getAllTweens(includeTimelines?: boolean): TweenMax[];
  export function pauseAll(tweens?: boolean, delayedCalls?: boolean): void;
  export function resumeAll(tweens?: boolean, delayedCalls?: boolean): void;
  export function killAll(tweens?: boolean, delayedCalls?: boolean, timelines?: boolean): void;
}

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
