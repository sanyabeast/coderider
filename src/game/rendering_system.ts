import {
    AmbientLight,
    Color,
    DirectionalLight,
    DoubleSide, Group,
    Material, MeshStandardMaterial,
    Object3D, PerspectiveCamera,
    RepeatWrapping, Scene, Texture,
    TextureLoader, Vector2, Vector3,
    WebGLRenderer, ACESFilmicToneMapping,
    SRGBColorSpace,
    ReinhardToneMapping,
    CineonToneMapping,
} from "three";

import { Game } from "./game";
import { isObject, isString, isUndefined } from "lodash-es";;
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
        const { scene, camera, renderer } = this.createRenderingCore();
        // Create scene structure with groups for different types of objects
        this._createSceneStructure(scene);

        // main lightings
        this.sunLight = new DirectionalLight(0xffffff, 1.5); // Increased intensity
        this.ambLight = new AmbientLight(0x6666ff, 0.8); // Increased intensity and adjusted color
        this.addToRenderGroup(ERenderGroup.Light, this.sunLight)
        this.addToRenderGroup(ERenderGroup.Light, this.ambLight)


        this.updateSize();

        // Add resize event listener
        window.addEventListener("resize", () => {
            this.updateSize();
        });
    }


    render() {
        this.renderer.render(this.scene, this.camera);
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
            emissiveIntensity: emissiveMap === null ? 0.0 : 1.5, // Increased emissive intensity
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
            antialias: true,
            canvas: this.canvas,
        });

        // Configure renderer settings
        // renderer.autoClear = false;
        // renderer.autoClearColor = false;
        // renderer.autoClearDepth = false;
        // renderer.autoClearStencil = false;
        renderer.setClearColor(0xfff17f);

        // Add tone mapping for better brightness and contrast
        renderer.toneMapping = CineonToneMapping;
        renderer.toneMappingExposure = 1.5; // Increase exposure for brighter scene
        renderer.outputColorSpace = SRGBColorSpace; // Use sRGB encoding for more accurate colors


        return { scene, camera, renderer };
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