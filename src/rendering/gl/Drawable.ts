import {gl} from '../../globals';
import {vec3, vec4, mat4} from 'gl-matrix';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;

  idxBound: boolean = false;
  posBound: boolean = false;
  norBound: boolean = false;

  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  abstract create() : void;

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
  }

  generateIdx() {
    this.idxBound = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posBound = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norBound = true;
    this.bufNor = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxBound) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxBound;
  }

  bindPos(): boolean {
    if (this.posBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posBound;
  }

  bindNor(): boolean {
    if (this.norBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norBound;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  updateCenter(newCtr: vec3): void {
    if (!this.positions) return;                // safety

    // delta = newCtr − oldCtr
    const dx = newCtr[0] - this.center[0];
    const dy = newCtr[1] - this.center[1];
    const dz = newCtr[2] - this.center[2];

    // translate every vertex
    for (let i = 0; i < this.positions.length; i += 4) {
      this.positions[i    ] += dx;
      this.positions[i + 1] += dy;
      this.positions[i + 2] += dz;
    }

    // store the new centre
    this.center[0] = newCtr[0];
    this.center[1] = newCtr[1];
    this.center[2] = newCtr[2];

    // re-upload to the GPU
    if (this.posBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
      // faster than bufferData because the size is unchanged
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
    }
  }
};

export default Drawable;
