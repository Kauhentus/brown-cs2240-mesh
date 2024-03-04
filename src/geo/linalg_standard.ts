import { Vertex } from "./atom_vertex";

export const add_v = (a: Vertex, b: Vertex) => {
    return new Vertex(
        a.x + b.x,
        a.y + b.y,
        a.z + b.z
    )
}

export const add_vs = (...vertices: Vertex[]) => {
    return vertices.reduce((a, v) => add_v(a, v), new Vertex(0, 0, 0));
}

export const sub_v = (a: Vertex, b: Vertex) => {
    return new Vertex(
        a.x - b.x,
        a.y - b.y,
        a.z - b.z
    )
}

export const smul_v = (a: Vertex, s: number) => {
    return new Vertex(
        a.x * s,
        a.y * s,
        a.z * s
    )
}

export const sdiv_v = (a: Vertex, s: number) => {
    return new Vertex(
        a.x / s,
        a.y / s,
        a.z / s
    )
}

export const same_v = (a: Vertex, b: Vertex) => {
    const delta = squared_distance_v(a, b);
    return delta < 1e-4;
}

export const avg_v = (...vs: Vertex[]) => {
    return new Vertex(
        vs.reduce((a, v) => a + v.x, 0) / vs.length,
        vs.reduce((a, v) => a + v.y, 0) / vs.length,
        vs.reduce((a, v) => a + v.z, 0) / vs.length,
    );
}

export const lerp_v = (t: number, a: Vertex, b: Vertex) => {
    return new Vertex(
        t * a.x + (1 - t) * b.x,
        t * a.y + (1 - t) * b.y,
        t * a.z + (1 - t) * b.z,
    );
}

export const distance_v = (a: Vertex, b: Vertex) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export const squared_distance_v = (a: Vertex, b: Vertex) => {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
}

export const magnitude_v = (a: Vertex) => {
    return Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
}

export const normalize_v = (a: Vertex) => {
    const length = magnitude_v(a);
    return new Vertex(
        a.x / length,
        a.y / length,
        a.z / length
    )
}

export const dot_v = (a: Vertex, b: Vertex) => {
    return a.x*b.x + a.y*b.y + a.z*b.z;
}

export const dot_vec3 = (a: number[], b: number[]) => {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export const dot_vec4 = (a: number[], b: number[]) => {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
}

export const cross_v = (a: Vertex, b: Vertex) => {
    return new Vertex(
        a.y*b.z - a.z*b.y,
        a.z*b.x - a.x*b.z,
        a.x*b.y - a.y*b.x
    );
}