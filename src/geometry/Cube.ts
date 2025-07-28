import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;

    constructor(center: vec3) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    applyTranslation() {
        // Build T = | 1 0 0 tx |
        //           | 0 1 0 ty |
        //           | 0 0 1 tz |
        //           | 0 0 0  1 |
        const T = mat4.create();
        const tx = this.center[0];
        const ty = this.center[1];
        const tz = this.center[2];
        mat4.translate(T, T, [tx, ty, tz]);   // T = translate(I, [tx,ty,tz])

        // For each vertex, p' = T * p
        for (let i = 0; i < this.positions.length; i += 4) {
            const p = vec4.fromValues(
                this.positions[i    ],
                this.positions[i + 1],
                this.positions[i + 2],
                this.positions[i + 3]   // will be 1
            );
            vec4.transformMat4(p, p, T);

            // write back
            this.positions[i    ] = p[0];
            this.positions[i + 1] = p[1];
            this.positions[i + 2] = p[2];
            // w stays 1
        }
    }

    computeNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
        const vCount   = positions.length / 4;           // ignore w
        const normals  = new Float32Array(vCount * 4);

        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i], i1 = indices[i+1], i2 = indices[i+2];

            const p0 = positions.subarray(i0*4, i0*4+3);
            const p1 = positions.subarray(i1*4, i1*4+3);
            const p2 = positions.subarray(i2*4, i2*4+3);

            // edge vectors
            const e1 = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
            const e2 = [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]];

            // face normal (cross product)
            const n  = [
                e1[1]*e2[2] - e1[2]*e2[1],
                e1[2]*e2[0] - e1[0]*e2[2],
                e1[0]*e2[1] - e1[1]*e2[0]
            ];

            // accumulate to each vertex
            [i0, i1, i2].forEach(idx => {
                normals[idx*4  ] += n[0];
                normals[idx*4+1] += n[1];
                normals[idx*4+2] += n[2];
            });
        }

        // normalise
        for (let i = 0; i < vCount; ++i) {
            const x = normals[i*4], y = normals[i*4+1], z = normals[i*4+2];
            const len = Math.hypot(x, y, z);
            normals[i*4  ] /= len;
            normals[i*4+1] /= len;
            normals[i*4+2] /= len;
            normals[i*4+3] = 0; // w-component
        }

        return normals;
    }

  create() {
    this.indices = new Uint32Array([
                        1, 0, 3, 1, 3, 2,
                        4, 5, 6, 4, 6, 7,
                        5, 1, 2, 5, 2, 6,
                        7, 6, 2, 7, 2, 3,
                        0, 4, 7, 0, 7, 3,
                        0, 1, 5, 0, 5, 4
                    ]);

    this.positions = new Float32Array([
                        -1, -1, -1, 1,
                        1, -1, -1, 1,
                        1, 1, -1, 1,
                        -1, 1, -1, 1,
                        -1, -1, 1, 1,
                        1, -1, 1, 1,
                        1, 1, 1, 1,
                        -1, 1, 1, 1
                    ]);
    
    this.applyTranslation();

    this.normals = this.computeNormals(this.positions, this.indices);

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created cube.`);
  }
};

export default Cube;
