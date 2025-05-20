import { forEach, forEachRight } from "lodash"
import { BufferAttribute, BufferGeometry } from "three"

let pool = []

class ChunkBufferGeometry extends BufferGeometry {
    chunkLength: number
    needsUpdate: boolean

    constructor(params) {
        let fromPool = pool.pop()

        if (fromPool) {
            fromPool.update(params)
            // console.log(fromPool)
            return fromPool
        }

        super()

        this.addAttribute("position", new BufferAttribute(new Float32Array(params.points.length * 18), 3));
        this.addAttribute("normal", new BufferAttribute(new Float32Array(params.points.length * 18), 3));
        this.addAttribute("uv", new BufferAttribute(new Float32Array(params.points.length * 12), 2));

        this.update(params)
    }

    update({ points, textureSize, pointsStep, textureUVYScale, groundHeight, normalZ }) {
        let position = 0
        let lastPointIndex = points.length - 1

        forEach(points, (point, index) => {
            let nextPoint = points[index + 1]

            if (nextPoint) {
                let scaleTextureSize = textureSize * pointsStep
                let chunkLength = this.chunkLength


                let uvx = ((point.x) % (scaleTextureSize)) / (scaleTextureSize)
                let uvxNext = ((nextPoint.x) % (scaleTextureSize)) / (scaleTextureSize)
                let uvy = textureUVYScale

                // console.log( point.x, index * pointsStep )

                if (uvxNext < uvx) {
                    uvxNext = 1
                }

                this.attributes.uv.setXY(position, uvx, 0)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, point.x, point.y, 0)

                this.attributes.uv.setXY(position, uvxNext, 0)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, nextPoint.x, nextPoint.y, 0)

                this.attributes.uv.setXY(position, uvx, uvy)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, point.x, point.y + groundHeight, 0)



                this.attributes.uv.setXY(position, uvxNext, 0)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, nextPoint.x, nextPoint.y, 0)

                this.attributes.uv.setXY(position, uvxNext, uvy)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, nextPoint.x, nextPoint.y + groundHeight, 0)

                this.attributes.uv.setXY(position, uvx, uvy)
                this.attributes.normal.setXYZ(position, 0, 0, normalZ)
                this.attributes.position.setXYZ(position++, point.x, point.y + groundHeight, 0)
            }

        })

        this.needsUpdate = true
        this.attributes.normal.needsUpdate = true
        this.attributes.position.needsUpdate = true
        this.attributes.uv.needsUpdate = true

        // this.computeBoundingBox()
        this.computeBoundingSphere()

        // this.geometryNeedsUpdate = true

        return this
    }

    dispose() {
        // super.dispose()
        pool.push(this)
        // super.dispose()
    }
}

export default ChunkBufferGeometry	