import { forEach } from "lodash";
import { config } from "../../../res/data/data";
import { Point } from "./types";


/**
 * TerrainGenerator class responsible for procedural terrain generation
 * Handles the creation of terrain points for game chunks
 */
export class TerrainGenerator {
    // Constants for terrain generation
    private readonly TERRAIN_GLOBAL_SEED = 6289371;
    private readonly TERRAIN_FEATURE_SCALE = 0.5;

    constructor() {}

    /**
     * Generate terrain points for a chunk based on its index
     * @param chunkIndex - The index of the chunk to generate points for
     * @returns Array of Point objects representing the terrain
     */
    generatePoints(chunkIndex: number): Point[] {
        // Get configuration values
        const count = config.chunkSize;
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
            this.applyJumps(points[index], globalPos);
            this.applyBumps(points[index], globalPos);
            this.applySlopes(points[index], globalPos);
        }

        return points;
    }

    /**
     * Apply sinusoid terrain patterns based on configuration
     */
    private applySinusoidTerrain(point: Point, position: number, step: number): void {
        forEach(config.curve.sinMap, (tuple) => {
            if ((point.x / step) % tuple[3] === 0) {
                // Reduce magnitude by 30% to make terrain less extreme
                const magnitude = tuple[1] * 0.7;
                point.y += Math.pow(Math.sin(position / tuple[0]), tuple[2]) * magnitude;
            }
        });
    }

    /**
     * Apply jump features to terrain at specific intervals
     */
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

    /**
     * Apply small bumps to terrain for more interesting features
     */
    private applyBumps(point: Point, globalPos: number): void {
        const bumps = this.generateNoise(globalPos * 0.5, 15, 1.5) * this.TERRAIN_FEATURE_SCALE;
        point.y += bumps;
    }

    /**
     * Apply occasional gentle slopes to terrain
     */
    private applySlopes(point: Point, globalPos: number): void {
        if (Math.abs(globalPos % 1500) < 300) {
            const slopePosition = (globalPos % 1500) / 300;
            const slopeIntensity = Math.sin(slopePosition * Math.PI) * 0.3;
            point.y += slopeIntensity * ((globalPos % 3000) - 1500) * 0.05 * this.TERRAIN_FEATURE_SCALE;
        }
    }

    /**
     * Generate deterministic noise based on position
     * Uses a combination of sine waves with different frequencies
     */
    private generateNoise(x: number, amplitude = 1, frequency = 1): number {
        return amplitude * (
            Math.sin(x * 0.01 * frequency + this.TERRAIN_GLOBAL_SEED * 0.1) * 0.5 +
            Math.sin(x * 0.02 * frequency + this.TERRAIN_GLOBAL_SEED * 0.2) * 0.3 +
            Math.sin(x * 0.04 * frequency + this.TERRAIN_GLOBAL_SEED * 0.3) * 0.2
        );
    }

    /**
     * Calculate spawn position Y coordinate for a given X position
     * @param x - The X coordinate to find spawn position for
     * @param chunkLength - Length of a chunk
     * @returns Y coordinate for spawning at the given X position
     */
    getSpawnPositionY(x: number, chunkLength: number): number {
        const count = config.chunkSize;
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
}
