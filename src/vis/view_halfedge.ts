import * as THREE from "three";
import { Halfedge } from "../geo/atom_halfedge";
import { scene } from "./init_three";

export const view_halfedge = (data: Halfedge[], color: number) => {
    const geometry = new THREE.BufferGeometry();

    let vertices: number[] = data.map(he => [
        ...he.vert.to_THREE(), ...he.next.vert.to_THREE()
    ]).flat();

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color: color}));
    scene.add(lines);
}