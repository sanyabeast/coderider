import { AmbientLight, Color, DirectionalLight, DoubleSide, Group, Material, MeshStandardMaterial, Object3D, PerspectiveCamera, RepeatWrapping, Scene, Texture, TextureLoader, Vector2, Vector3, WebGLRenderer } from "three";

import EffectComposer from "../../three_fx/EffectComposer";
import RenderPass from "../../three_fx/passes/RenderPass";
import CopyShader from "../../three_fx/shaders/CopyShader";
import ShaderPass from "../../three_fx/passes/ShaderPass";
import RGBShiftShader from "../../three_fx/shaders/RGBShiftShader";
import ColorCorrectionShader from "../../three_fx/shaders/ColorCorrectionShader";
import FilmPass from "../../three_fx/passes/FilmPass";
import UnrealBloomPass from "../../three_fx/passes/UnrealBloomPass";

import { Game } from "./Game";
import { isObject, isString, isUndefined } from "lodash";
import { makeGetter } from "@/Helpers";

const CAMERA_FOV = 90;

export enum ERenderGroup {
    Light = "light",
    Front = "front",
    Back = "back",
    Props = "props"
}

export enum ETextureType {
    Diffuse = "",
    Normal = "_n",
    Emission = "_e",
    Roughness = "_r",
    Metallness = "_m",
}

export interface IMaterialParams {
    texture: string,
    transparent: boolean,
    metallic: number,
    roughness: number,
    repeat?: any,
    flipY?: boolean
}

export class RenderingSystem {
    public camera: PerspectiveCamera

    private scene: Scene
    private composer: EffectComposer
    private renderer: WebGLRenderer
    private canvas: HTMLCanvasElement;

    private fxPasses: {} = {}

    public renderingResolution = new Vector2(1, 1)
    private game: Game;

    public sunLight: DirectionalLight
    public ambLight: AmbientLight

    private groups: Record<ERenderGroup, Group> = {} as Record<ERenderGroup, Group>
    private cache: {
        textures: {
            [x: string]: Texture
        },
        materials: {
            [x: string]: MeshStandardMaterial
        }
    } = {
            textures: {},
            materials: {}
        }

    constructor(game: Game, params: { canvas: HTMLCanvasElement }) {
        this.canvas = params.canvas
        this.game = game

        // Create core rendering components
        const { scene, camera, renderer, composer } = this.createRenderingCore();
        // Create scene structure with groups for different types of objects
        this._createSceneStructure(scene);

        // main lightings
        this.sunLight = new DirectionalLight(0xffffff, 1);
        this.ambLight = new AmbientLight(0x3300ff, 0.5);
        this.addToRenderGroup(ERenderGroup.Light, this.sunLight)
        this.addToRenderGroup(ERenderGroup.Light, this.ambLight)


        // Set up post-processing effects
        this.setupComposer();

        this.updateSize();

        // Add resize event listener
        window.addEventListener("resize", () => {
            this.updateSize();
        });
    }


    render() {
        // Add safety check to prevent error when composer is not initialized
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    addToScene(object3d: Object3D) {
        this.scene.add(object3d)
    }

    getRenderGroup(type: ERenderGroup): Group {
        return this.groups[type]
    }

    addToRenderGroup(type: ERenderGroup, object3d: Object3D) {
        this.getRenderGroup(type).add(object3d)
    }

    removeFromRenderGroup(type: ERenderGroup, object3d: Object3D) {
        this.getRenderGroup(type).remove(object3d)
    }

    async createMaterial(id: string, params: IMaterialParams): Promise<MeshStandardMaterial> {
        if (this.cache.materials[id]) return this.cache.materials[id]

        let emissiveMap = await this.loadTexture(params.texture, ETextureType.Emission, { repeat: params.repeat, flipY: params.flipY });
        let mat = new MeshStandardMaterial({
            map: await this.loadTexture(params.texture, ETextureType.Diffuse, { repeat: params.repeat, flipY: params.flipY }),
            normalMap: await this.loadTexture(params.texture, ETextureType.Normal, { repeat: params.repeat, flipY: params.flipY }),
            emissiveMap: emissiveMap,
            roughnessMap: await this.loadTexture(params.texture, ETextureType.Roughness, { repeat: params.repeat, flipY: params.flipY }),
            metalnessMap: await this.loadTexture(params.texture, ETextureType.Metallness, { repeat: params.repeat, flipY: params.flipY }),
            side: DoubleSide,
            emissiveIntensity: emissiveMap === null ? 0.0 : 1.0,
            emissive: new Color(1, 1, 1),
            transparent: params.transparent,
            alphaTest: 0.5, // Needed for proper transparency in plants
            metalness: params.metallic, // Non-metallic (plants)
            roughness: params.roughness, // Completely rough/matte
        });

        console.log('mat', id, mat)

        this.cache.materials[id] = mat;
        return mat;
    }

    private async loadTexture(textureName: string, type: ETextureType = ETextureType.Diffuse, params: { repeat: any, flipY?: boolean } = { repeat: RepeatWrapping }) {

        if (!isString(textureName)) {
            console.log(`skip loading texture`, textureName);
            return null
        }

        // Extract the base name without extension
        let baseNameSplitted = textureName.split(".");
        let extension = baseNameSplitted.pop();
        let baseName = baseNameSplitted.join(".");
        let finalTextureName = baseName + type + "." + extension

        if (isObject(this.cache.textures[finalTextureName])) return this.cache.textures[finalTextureName];

        console.log(`loading texture: ${textureName}, type: ${type}`)

        // Fix path back to original - use res/pics/ instead of /res/img/
        try {
            let texture = await this.textureLoaderWrapper(`res/pics/${finalTextureName}`);
            texture.wrapT = params.repeat;
            texture.wrapS = params.repeat;

            texture.flipY = params.flipY === true;
            texture.needsUpdate = true;

            // Store successful loads in cache
            this.cache.textures[finalTextureName] = texture;
            console.log(`Loaded texture: ${finalTextureName}`)
            return texture;
        } catch (err) {
            console.log(`FAILED! texture: ${finalTextureName}`)
            this.cache.textures[finalTextureName] = null;
            return null;
        }
    }

    private textureLoaderWrapper(texturePath): Promise<Texture> {
        return new Promise((resolve, reject) => {
            let texture = new TextureLoader().load(texturePath, () => {
                resolve(texture)
            }, () => {
                // console.log(`texture loading progress: ${texturePath}`)
            }, () => {
                // console.log(`texture loading error: ${texturePath}`)
                reject()
            });
        })
    }

    private updateSize() {
        let width = window.innerWidth * window.devicePixelRatio;
        let height = window.innerHeight * window.devicePixelRatio;

        this.camera.aspect = width / height;
        this.renderingResolution.x = width;
        this.renderingResolution.y = height;

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);

        console.log(`renderer size: ${width} - ${height}`);
    }

    /**
     * Create the core rendering components: scene, camera, renderer, and composer
     */
    private createRenderingCore() {
        // Create scene
        const scene = this.scene = new Scene();

        // Create camera
        const camera = this.camera = new PerspectiveCamera(
            CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            0.001,
            100000
        );

        camera.rotation.z = Math.PI;
        camera.rotation.y = Math.PI;

        // Create renderer
        const renderer = this.renderer = new WebGLRenderer({
            antialias: false,
            canvas: this.canvas,
        });

        // Configure renderer settings
        renderer.autoClear = false;
        renderer.autoClearColor = false;
        renderer.autoClearDepth = false;
        renderer.autoClearStencil = false;
        renderer.setClearColor(0xfff17f);

        // Create effect composer for post-processing
        const composer = this.composer = new EffectComposer(renderer);

        return { scene, camera, renderer, composer };
    }

    private createPostProcessingPasses() {
        // Basic render pass
        const renderPass = new RenderPass(this.scene, this.camera);

        // Color correction for better contrast and vibrancy
        const colorCorPass = new ShaderPass(ColorCorrectionShader);
        colorCorPass.uniforms.powRGB.value = new Vector3(1.1, 1.1, 1.15); // Slightly increase blue for sky
        colorCorPass.uniforms.mulRGB.value = new Vector3(1.2, 1.15, 1.1); // Better contrast

        // Subtle RGB shift for a slight chromatic aberration effect
        const rgbsPass = new ShaderPass(RGBShiftShader);
        rgbsPass.material.uniforms.amount.value = 0.0015; // Reduced for subtlety
        rgbsPass.material.uniforms.angle.value = 0.5; // Angle of shift

        // Minimal film grain without strong scanlines
        // Parameters: (noise intensity, scanline intensity, scanline count, grayscale)
        const filmPass = new FilmPass(0.15, 0.1, 480, false); // Reduced scanline intensity

        // Almost imperceptible bloom effect
        const bloomParams = {
            strength: 0.05, // Reduced bloom strength
            radius: 0.2,   // Small bloom radius
            threshold: 0.95, // High threshold for subtle effect
        };

        const bloomPass = new UnrealBloomPass(
            new Vector2(window.innerWidth, window.innerHeight),
            bloomParams.strength,
            bloomParams.radius,
            bloomParams.threshold
        );

        // Final copy to screen
        const copyPass = new ShaderPass(CopyShader);
        copyPass.renderToScreen = true;

        return { renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass, bloomParams };
    }

    /**
     * Add passes to composer in the correct order
     */
    private addPassesToComposer(
        renderPass: RenderPass,
        bloomPass: UnrealBloomPass,
        colorCorPass: ShaderPass,
        rgbsPass: ShaderPass,
        filmPass: FilmPass,
        copyPass: ShaderPass
    ) {
        this.composer.addPass(renderPass);   // Render the scene
        this.composer.addPass(bloomPass);    // Add bloom first
        this.composer.addPass(colorCorPass); // Then correct colors
        // this.composer.addPass(rgbsPass);     // Add subtle RGB shift
        this.composer.addPass(filmPass);     // Add film grain last
        this.composer.addPass(copyPass);     // Copy to screen
    }

    /**
         * Set up post-processing effects composer
         */
    private setupComposer() {
        // Create all post-processing passes
        const { renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass, bloomParams } =
            this.createPostProcessingPasses();

        // Store passes for reference
        this.storePostProcessingPasses(renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass);

        // Configure pass properties and behavior
        this._configurePassProperties(renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass);

        // Add passes to composer in correct order
        this.addPassesToComposer(renderPass, bloomPass, colorCorPass, rgbsPass, filmPass, copyPass);

    }


    private storePostProcessingPasses(
        renderPass: RenderPass,
        colorCorPass: ShaderPass,
        rgbsPass: ShaderPass,
        bloomPass: UnrealBloomPass,
        filmPass: FilmPass,
        copyPass: ShaderPass
    ) {
        this.fxPasses = {
            renderPass,
            colorCorPass,
            rgbsPass,
            bloomPass,
            filmPass,
            copyPass,
        };
    }

    private _configurePassProperties(
        renderPass: RenderPass,
        colorCorPass: ShaderPass,
        rgbsPass: ShaderPass,
        bloomPass: UnrealBloomPass,
        filmPass: FilmPass,
        copyPass: ShaderPass
    ) {
        // Configure render pass to not render to screen directly
        makeGetter(
            renderPass,
            "renderToScreen",
            () => false,
            () => { }
        );

        // Enable all effect passes
        makeGetter(
            [colorCorPass, rgbsPass, bloomPass, filmPass, copyPass],
            "enabled",
            () => true
        );
    }

    private _createSceneStructure(scene: Scene) {
        // Create light group for scene-wide lights
        const lightRenderGroup = this.groups[ERenderGroup.Light] = new Group();
        scene.add(lightRenderGroup);

        // Create ground chunks group
        const frontRenderGroup = this.groups[ERenderGroup.Front] = new Group();
        frontRenderGroup.position.z = 0; // Same as car for consistent lighting
        scene.add(frontRenderGroup);

        // Create greenery chunks group with parallax offset
        const backRenderGroup = this.groups[ERenderGroup.Back] = new Group();
        backRenderGroup.position.z = 10; // Different z for parallax effect
        backRenderGroup.position.y = 20;
        scene.add(backRenderGroup);

        // Create objects group for game objects
        const propsRenderGroup = this.groups[ERenderGroup.Props] = new Group();
        propsRenderGroup.name = "objects";
        scene.add(propsRenderGroup);
    }
}