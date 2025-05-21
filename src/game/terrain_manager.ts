import { forEach } from "lodash-es";;
import { chunkLength, config, landscapeSkins, physicsConfig, renderingConfig } from "../data/data";
import { Point } from "./types";
import { Game } from "./game";
import { Mesh } from "three";
import { ERenderGroup } from "./rendering_system";
import ChunkBufferGeometry from "./chunk_buffer_geometry";
import { nearestMult } from "@/Helpers";


interface Chunk {
    mesh: Mesh;
    physicBody: Matter.Body;
    points: Point[];
    greenery: Mesh;
}


export class TerrainGenerator {

    // Constants for terrain generation
    private readonly TERRAIN_GLOBAL_SEED = 6289371;
    private readonly TERRAIN_FEATURE_SCALE = 0.5;
    private currentChunkIndex: number = 0;

    chunks: { [x: string]: Chunk } = {}
    activeChunks: { [key: string]: boolean } = {}

    game: Game;

    constructor(game: Game) {
        this.game = game
    }

    generatePoints(chunkIndex: number): Point[] {
        // Get configuration values
        const count = renderingConfig.chunkSize;
        const start = chunkIndex * count;
        const step = config.curve.pointsStep;
        const points: Point[] = [];

        // Generate base points
        for (let a = start; a <= start + count; a++) {
            // Create base point at current position
            points.push({
                x: a * step,
                y: 0,
            });

            const index = points.length - 1;
            const globalPos = a; // Use global position for seamless features

            // Apply different terrain features to the current point
            this.applySinusoidTerrain(points[index], a, step);
            // this.applyJumps(points[index], globalPos);
            // this.applyBumps(points[index], globalPos);
            // this.applySlopes(points[index], globalPos);
        }

        return points;
    }

    private applySinusoidTerrain(point: Point, position: number, step: number): void {
        forEach(config.curve.sinMap, (tuple) => {
            if ((point.x / step) % tuple[3] === 0) {
                // Reduce magnitude by 30% to make terrain less extreme
                const magnitude = tuple[1] * 0.7;
                point.y += Math.pow(Math.sin(position / tuple[0]), tuple[2]) * magnitude;
            }
        });
    }

    private applyJumps(point: Point, globalPos: number): void {
        if (Math.abs(globalPos % 1000) < 50) {
            const distanceFromJump = Math.abs((globalPos % 1000) - 25);
            if (distanceFromJump < 20) {
                // Gentle hill-like jump with limited height
                const jumpShape = Math.cos(distanceFromJump * (Math.PI / 20));
                point.y += jumpShape * 40 * this.TERRAIN_FEATURE_SCALE;
            }
        }
    }

    private applyBumps(point: Point, globalPos: number): void {
        const bumps = this.generateNoise(globalPos * 0.5, 15, 1.5) * this.TERRAIN_FEATURE_SCALE;
        point.y += bumps;
    }

    private applySlopes(point: Point, globalPos: number): void {
        if (Math.abs(globalPos % 1500) < 300) {
            const slopePosition = (globalPos % 1500) / 300;
            const slopeIntensity = Math.sin(slopePosition * Math.PI) * 0.3;
            point.y += slopeIntensity * ((globalPos % 3000) - 1500) * 0.05 * this.TERRAIN_FEATURE_SCALE;
        }
    }

    private generateNoise(x: number, amplitude = 1, frequency = 1): number {
        return amplitude * (
            Math.sin(x * 0.01 * frequency + this.TERRAIN_GLOBAL_SEED * 0.1) * 0.5 +
            Math.sin(x * 0.02 * frequency + this.TERRAIN_GLOBAL_SEED * 0.2) * 0.3 +
            Math.sin(x * 0.04 * frequency + this.TERRAIN_GLOBAL_SEED * 0.3) * 0.2
        );
    }

    public getSpawnPosition(x: number): number {
        const count = renderingConfig.chunkSize;
        const step = config.curve.pointsStep;

        // Calculate chunk index from x position
        const chunkIndex = Math.floor(x / chunkLength);

        // Generate points for this chunk
        const points = this.generatePoints(chunkIndex);

        // Find the closest point to the requested x position
        const pointIndex = Math.floor((x % chunkLength) / step);

        // Return the y value if found, otherwise a default value
        return points[pointIndex] ? points[pointIndex].y : -500;
    }

    async initializeTerrainChunks() {
        // Create initial set of chunks (previous, current, next)
        await this.addChunk(-1);
        await this.addChunk(0);
        await this.addChunk(1);
    }


    private async checkChunks() {
        let currentChunkIndex = this.currentChunkIndex;

        let prevChunkIndex = currentChunkIndex - 1;
        let nextChunkIndex = currentChunkIndex + 1;

        await this.addChunk(currentChunkIndex);
        await this.addChunk(prevChunkIndex);
        await this.addChunk(nextChunkIndex);

        forEach(this.activeChunks, (active, chunkIndex) => {
            if (active) {
                if (
                    parseInt(chunkIndex) != currentChunkIndex &&
                    parseInt(chunkIndex) != prevChunkIndex &&
                    parseInt(chunkIndex) != nextChunkIndex
                ) {
                    this.hideChunk(parseInt(chunkIndex));
                }
            }
        });
    }

    updateActiveChunk(x: any) {

        let currentChunkIndex =
            nearestMult(
                x,
                chunkLength,
                false,
                true
            ) / chunkLength;


        this.checkChunks();
        this.currentChunkIndex = currentChunkIndex;
    }

    private hideChunk(chunkIndex: number, remove: boolean = false) {
        if (!this.activeChunks[chunkIndex]) {
            return;
        } else {
            delete this.activeChunks[chunkIndex];

            this.game.renderingSystem.removeFromRenderGroup(ERenderGroup.Front, this.chunks[chunkIndex].mesh)
            this.game.renderingSystem.removeFromRenderGroup(ERenderGroup.Back, this.chunks[chunkIndex].greenery)

            if (remove) {
                this.chunks[chunkIndex].mesh.geometry.dispose();
                this.chunks[chunkIndex].greenery.geometry.dispose();
            }

            if (this.chunks[chunkIndex].physicBody) {
                this.game.physicsSystem.removeBody(this.chunks[chunkIndex].physicBody)
            }

            if (remove) {
                delete this.chunks[chunkIndex];
            }
        }
    }

    private showChunk(chunkIndex) {
        if (this.activeChunks[chunkIndex]) {
            return;
        } else {
            this.activeChunks[chunkIndex] = true;
            this.game.renderingSystem.addToRenderGroup(ERenderGroup.Front, this.chunks[chunkIndex].mesh)
            this.game.renderingSystem.addToRenderGroup(ERenderGroup.Back, this.chunks[chunkIndex].greenery)

            this.game.physicsSystem.addBody(this.chunks[chunkIndex].physicBody)
        }
    }

    private async addChunk(chunkIndex: number) {
        if (this.chunks[chunkIndex]) {
            this.showChunk(chunkIndex);
            return;
        }

        let points = this.generatePoints(chunkIndex);

        let groundGeometry = new ChunkBufferGeometry({
            points,
            textureSize: config.groundTextureSize,
            pointsStep: config.curve.pointsStep,
            textureUVYScale: config.groundTextureUVYScale,
            groundHeight: config.groundHeight,
            normalZ: 1,
        });

        let groundMaterial = await this.game.renderingSystem.createMaterial('ground-material', {
            texture: landscapeSkins.forest.texture,
            transparent: false,
            metallic: 0,
            roughness: 1
        })

        let groundMesh = new Mesh(groundGeometry, groundMaterial);
        this.game.renderingSystem.addToRenderGroup(ERenderGroup.Front, groundMesh)

        let physicBody = this.game.physicsSystem.generateCurvedBody(points, {
            friction: physicsConfig.ground.friction,
            restitution: physicsConfig.ground.restitution,
            frictionAir: physicsConfig.ground.frictionAir,
        });


        this.game.physicsSystem.addBody(physicBody)

        /*greenery*/
        let greeneryGeometry = new ChunkBufferGeometry({
            points,
            textureSize: config.greeneryTextureSize,
            pointsStep: config.curve.pointsStep,
            textureUVYScale: config.greeneryTextureUVYScale,
            groundHeight: -config.greeneryHeight,
            normalZ: -1,
        });

        // Always create a fresh material for greenery to ensure consistent appearance
        let greeneryMaterial = await this.game.renderingSystem.createMaterial("greenery", {
            texture: landscapeSkins.forest.greenery.texture,
            transparent: true,
            metallic: 0,
            roughness: 1,
            flipY: true
        })
        // Don't store for reuse - we want fresh materials for consistent appearance
        // this.data.greeneryMaterial = greeneryMaterial

        let greeneryMesh = new Mesh(greeneryGeometry, greeneryMaterial);
        this.game.renderingSystem.addToRenderGroup(ERenderGroup.Back, greeneryMesh)

        this.chunks[chunkIndex] = {
            mesh: groundMesh,
            physicBody: physicBody,
            points,
            greenery: greeneryMesh,
        };

        this.activeChunks[chunkIndex] = true;
    }


}
