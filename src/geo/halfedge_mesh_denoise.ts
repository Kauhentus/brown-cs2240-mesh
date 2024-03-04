import { view_vertex } from "../vis/view_vertex";
import { Vertex } from "./atom_vertex";
import { HalfedgeMesh } from "./halfedge_mesh";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { smul_v, normalize_v, cross_v, sub_v, avg_v, distance_v, dot_v, add_v } from "./linalg_standard";

export const halfedge_mesh_denoise = (mesh: HalfedgeMesh, rho: number, sigma_c: number, sigma_s: number) => {
    mesh.verts.forEach(v => {
        let neighbors = vertex_get_neighbors(v);
        let normals: Vertex[] = [];
        for(let i = 0; i < neighbors.verts.length; i++){
            let sv = neighbors.verts[i];
            let ev = neighbors.verts[(i + 1) % neighbors.verts.length];
            normals.push(smul_v(cross_v(sub_v(sv, v), sub_v(ev, v)), -0.5));
        }
        let n = normalize_v(avg_v(...normals));
        v.cache2 = n;

        let traversed: Vertex[] = [];
        let neighborhood: Vertex[] = [];
        let max_dist = rho;
        const get_euclidean_neighborhood = (v2: Vertex) => {
            traversed.push(v2);
            if(v2.flag1) return;
            v2.flag1 = true;

            if(distance_v(v, v2) < max_dist){
                neighborhood.push(v2);
                let potential_vs = vertex_get_neighbors(v2);
                potential_vs.verts.forEach(v3 => get_euclidean_neighborhood(v3));
            }
        };
        get_euclidean_neighborhood(v);
        traversed.forEach(v => v.flag1 = false);
        let q = neighborhood;

        let sum = 0;
        let normalizer = 0;

        for(let i = 0; i < q.length; i++){
            let q_i = q[i];
            let t = distance_v(v, q_i);
            let h = -dot_v(n, sub_v(v, q_i));
            let wc = Math.exp(-t*t / (2*sigma_c*sigma_c));
            let ws = Math.exp(-h*h / (2*sigma_s*sigma_s));
            sum += (wc * ws) * h;
            normalizer += (wc * ws);
        }

        let new_position = add_v(v, smul_v(n, sum / normalizer));
        v.cache1 = new_position;
        // console.log(v.x, new_position.x, sum / normalizer)
    });

    mesh.verts.forEach(v => {
        let new_pos = v.cache1;
        v.x = new_pos.x;
        v.y = new_pos.y;
        v.z = new_pos.z;
    });

    // view_vertex(mesh.verts.map(v => add_v(v, v.cache2)), 0xff0000, 0.1)
}