import { Group, Object3D, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";

import { TweenMax } from "gsap/TweenMax";
import _ from "../../Helpers";

import EffectComposer from "../../three_fx/EffectComposer";
import RenderPass from "../../three_fx/passes/RenderPass";
import CopyShader from "../../three_fx/shaders/CopyShader";
import ShaderPass from "../../three_fx/passes/ShaderPass";
import RGBShiftShader from "../../three_fx/shaders/RGBShiftShader";
import ColorCorrectionShader from "../../three_fx/shaders/ColorCorrectionShader";
import FilmPass from "../../three_fx/passes/FilmPass";
import UnrealBloomPass from "../../three_fx/passes/UnrealBloomPass";

import { Game } from "./Game";

export enum ERenderGroup {
    Light = "light",
    Front = "front",
    Back = "back",
    Props = "props"
}

export class RenderingSystem {
    public camera: PerspectiveCamera
    public scene: Scene
    composer: EffectComposer
    renderer: WebGLRenderer
    canvas: HTMLCanvasElement;

    private fxPasses: {} = {}

    public renderingResolution = new Vector2(1, 1)
    game: Game;

    private groups: Record<ERenderGroup, Group> = {} as Record<ERenderGroup, Group>

    constructor(game: Game, params: { canvas: HTMLCanvasElement }) {
        this.canvas = params.canvas
        this.game = game

        // Create core rendering components
        const { scene, camera, renderer, composer } = this._createRenderingCore();

        // Set up camera properties and animation
        this._setupCamera(camera);

        // Create scene structure with groups for different types of objects
        this._createSceneStructure(scene);

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
    private _createRenderingCore() {
        // Create scene
        const scene = this.scene = new Scene();

        // Create camera
        const camera = this.camera = new PerspectiveCamera(
            90,
            window.innerWidth / window.innerHeight,
            0.001,
            100000
        );

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


    /**
         * Set up camera properties and animation
         */
    private _setupCamera(camera: PerspectiveCamera) {
        // Set initial rotation
        camera.rotation.z = Math.PI;
        camera.rotation.y = Math.PI;

        // Add subtle camera movement animation
        TweenMax.fromTo(
            camera.rotation,
            10,
            {
                z: Math.PI + -Math.PI / 128,
            },
            {
                z: Math.PI + Math.PI / 128,
                repeat: -1,
                yoyo: true,
                ease: "Power1.easeInOut",
            }
        );
    }

    /**
     * Create all post-processing passes
     */
    private _createPostProcessingPasses() {
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
    private _addPassesToComposer(
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
        this.composer.addPass(rgbsPass);     // Add subtle RGB shift
        this.composer.addPass(filmPass);     // Add film grain last
        this.composer.addPass(copyPass);     // Copy to screen
    }

    /**
         * Set up post-processing effects composer
         */
    private setupComposer() {
        // Create all post-processing passes
        const { renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass, bloomParams } =
            this._createPostProcessingPasses();

        // Store passes for reference
        this._storePostProcessingPasses(renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass);

        // Configure pass properties and behavior
        this._configurePassProperties(renderPass, colorCorPass, rgbsPass, bloomPass, filmPass, copyPass);

        // Add passes to composer in correct order
        this._addPassesToComposer(renderPass, bloomPass, colorCorPass, rgbsPass, filmPass, copyPass);

        // Set up dynamic effects based on day/night cycle
        this._setupDynamicEffects(bloomPass, bloomParams);
    }


    /**
     * Set up dynamic effects based on day/night cycle
     */
    private _setupDynamicEffects(bloomPass: UnrealBloomPass, bloomParams: any) {
        // Dynamic day/night effect on bloom strength
        _.getter(bloomPass, "strength", () => {
            // Increase bloom at night for better lighting effects
            if (this.game.hour >= 18 || this.game.hour <= 6) {
                return bloomParams.strength * 1.5;
            }
            return bloomParams.strength;
        });
    }

    private _storePostProcessingPasses(
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


    /**
     * Configure pass properties and behavior
     */
    private _configurePassProperties(
        renderPass: RenderPass,
        colorCorPass: ShaderPass,
        rgbsPass: ShaderPass,
        bloomPass: UnrealBloomPass,
        filmPass: FilmPass,
        copyPass: ShaderPass
    ) {
        // Configure render pass to not render to screen directly
        _.getter(
            renderPass,
            "renderToScreen",
            () => false,
            () => { }
        );

        // Enable all effect passes
        _.getter(
            [colorCorPass, rgbsPass, bloomPass, filmPass, copyPass],
            "enabled",
            () => true
        );
    }

    /**
        * Create scene structure with groups for different types of objects
        */
    private _createSceneStructure(scene: Scene) {
        // Create light group for scene-wide lights
        const lightGroup = this.groups[ERenderGroup.Light] = new Group();
        lightGroup.name = "lights";
        scene.add(lightGroup);

        // Create ground chunks group
        const groundChunksGroup = this.groups[ERenderGroup.Front] = new Group();
        groundChunksGroup.name = "ground-chunks";
        groundChunksGroup.position.z = 0; // Same as car for consistent lighting
        scene.add(groundChunksGroup);

        // Create greenery chunks group with parallax offset
        const greeneryChunksGroup = this.groups[ERenderGroup.Back] = new Group();
        greeneryChunksGroup.name = "greenery-chunks";
        greeneryChunksGroup.position.z = 10; // Different z for parallax effect
        greeneryChunksGroup.position.y = 20;
        scene.add(greeneryChunksGroup);

        // Create objects group for game objects
        const objectsGroup = this.groups[ERenderGroup.Props] = new Group();
        objectsGroup.name = "objects";
        scene.add(objectsGroup);
    }
}