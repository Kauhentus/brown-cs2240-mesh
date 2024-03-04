import { Vertex } from "./atom_vertex";
import { HalfedgeMesh } from "./halfedge_mesh";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { smul_v, normalize_v, cross_v, sub_v, avg_v, add_v } from "./linalg_standard";

export const halfedge_mesh_add_noise = (mesh: HalfedgeMesh, offset: number) => {
    mesh.verts.forEach(v => {
        let neighbors = vertex_get_neighbors(v);
        let normals: Vertex[] = [];
        for(let i = 0; i < neighbors.verts.length; i++){
            let sv = neighbors.verts[i];
            let ev = neighbors.verts[(i + 1) % neighbors.verts.length];
            normals.push(smul_v(normalize_v(cross_v(sub_v(sv, v), sub_v(ev, v))), -1));
        }
        let avg_normal = avg_v(...normals);
        v.cache1 = avg_normal;
    });

    mesh.verts.forEach(v => {
        let new_pos = add_v(v, smul_v(v.cache1, Math.random() * offset));
        v.x = new_pos.x;
        v.y = new_pos.y;
        v.z = new_pos.z;
    });
}