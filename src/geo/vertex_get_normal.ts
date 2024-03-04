import { Vertex } from "./atom_vertex";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { smul_v, cross_v, sub_v, normalize_v, avg_v } from "./linalg_standard";

export const vertex_get_normal = (v: Vertex, area_weighted: boolean) => {
    let neighbors = vertex_get_neighbors(v);
    let normals: Vertex[] = [];

    for(let i = 0; i < neighbors.verts.length; i++){
        let sv = neighbors.verts[i];
        let ev = neighbors.verts[(i + 1) % neighbors.verts.length];
        
        if(area_weighted){
            normals.push(smul_v(cross_v(sub_v(sv, v), sub_v(ev, v)), -0.5));
        }

        else {
            normals.push(smul_v(normalize_v(cross_v(sub_v(sv, v), sub_v(ev, v))), -0.5));
        }
    }
    
    return normalize_v(avg_v(...normals));
}