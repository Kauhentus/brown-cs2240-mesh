import { PriorityQueue } from "@datastructures-js/priority-queue";
import { Halfedge } from "./atom_halfedge";
import { HalfedgeMesh } from "./halfedge_mesh";
import { Vertex } from "./atom_vertex";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { add_v, avg_v, cross_v, dot_v, dot_vec3, dot_vec4, normalize_v, smul_v, sub_v } from "./linalg_standard";
import { add_mat4, mat4_invert, mat4_invert_with_check, mat4_matmul, mat4_vecmul, mat4_zeroes, smul_mat4 } from "./linalg_matrix";
import { view_vertex } from "../vis/view_vertex";
import { halfedge_mesh_edge_collapse } from "./halfedge_mesh_edge_collapse";
import { MinHeap } from "mnemonist";

export const distance_to_surface_error = (v: Vertex) => {
    let neighbors = vertex_get_neighbors(v);
    let normals = [];
    for(let i = 0; i < neighbors.verts.length; i++){
        let sv = neighbors.verts[i];
        let ev = neighbors.verts[(i + 1) % neighbors.verts.length];
        normals.push(smul_v(normalize_v(cross_v(sub_v(sv, v), sub_v(ev, v))), -1));
    }

    let Q = mat4_zeroes();
    for(let i = 0; i < neighbors.verts.length; i++){
        let [a, b, c] = normals[i].to_THREE();
        let d = -dot_v(normals[i], v);
        let Q_i = [
            a*a, a*b, a*c, a*d,
            b*a, b*b, b*c, b*d,
            c*a, c*b, c*c, c*d,
            d*a, d*b, d*c, d*d,
        ];
        Q = add_mat4(Q, Q_i);
    }

    return Q;
}

export const decimate = (mesh: HalfedgeMesh, target_triangles: number) => {
    mesh.reset_flags();
    const compare = (a: Halfedge, b: Halfedge) => (a.cache1 - b.cache1);
    const edge_queue = new PriorityQueue<Halfedge>(compare);

    // calculate quadric error for each vertex
    mesh.verts.forEach(v => v.cache1 = distance_to_surface_error(v));

    // and add all the edges into the edge queue;
    const calculate_halfedge_quadric_costs = (halfedges: Halfedge[]) => {
        halfedges.map(he => {
            let Q_1 = he.vert.cache1;
            let Q_2 = he.twin.vert.cache1;
            let Q_bar = add_mat4(Q_1, Q_2);
    
            // 0  4  8  12
            // 1  5  9  13
            // 2  6  10 14
            // 3  7  11 15
            let inv = mat4_invert_with_check([
                // row major order
                // Q_bar[0], Q_bar[4], Q_bar[8],  Q_bar[12], // q_11, q_12, q_13, q_14,
                // Q_bar[4], Q_bar[5], Q_bar[9],  Q_bar[13], // q_12, q_22, q_23, q_24,
                // Q_bar[8], Q_bar[9], Q_bar[10], Q_bar[14], // q_13, q_23, q_33, q_34,
                // 0, 0, 0, 1                                // 0,    0,    0,    1

                Q_bar[0], Q_bar[4], Q_bar[8],  0,
                Q_bar[4], Q_bar[5], Q_bar[9],  0,
                Q_bar[8], Q_bar[9], Q_bar[10], 0,
                Q_bar[12], Q_bar[13], Q_bar[14], 1
            ]);
            if(!inv.invertible){
                console.log('non-invertible matrix encountered...');
                let v_bar = avg_v(he.vert, he.twin.vert);
                he.cache1 = (he.vert.cache1 + he.vert.cache1) * 0.5;
                he.cache2 = v_bar.to_THREE();
                he.cache3 = Q_bar;
            } else {
                let v_bar = mat4_vecmul(inv.result, [0, 0, 0, 1]);
                let cost = dot_vec4(v_bar, mat4_vecmul(Q_bar, v_bar));
                he.cache1 = cost;
                he.cache2 = v_bar;
                he.cache3 = Q_bar;
            }
        });
    }
    calculate_halfedge_quadric_costs(mesh.halfedges);
    mesh.halfedges.forEach(he => edge_queue.push(he))

    let num_iterations = 0;
    let num_removed = 0;
    let max_iterations = 100000;

    while(mesh.faces.length - num_removed > target_triangles && num_iterations < max_iterations){
        let he = edge_queue.pop();
        if(he == null) break;
        if(he.to_delete === true) continue;

        let new_vert = new Vertex(...he.cache2);
        let event = halfedge_mesh_edge_collapse(mesh, he, false, new_vert);

        if(event.failed){
            console.log("event failed :(")
        } else {
            event.vert.cache1 = he.cache3;

            let neighbors = vertex_get_neighbors(event.vert);
            calculate_halfedge_quadric_costs(neighbors.leaving_halfedges);
            neighbors.leaving_halfedges.forEach((he) => {
                he.twin.cache1 = he.cache1;
                he.twin.cache2 = he.cache2;
                he.twin.cache3 = he.cache3;
            });
            // @ts-ignore
            edge_queue._heap.fix();
        
            num_removed += 2;
        }

        num_iterations += 1;
    }
    mesh.cull_old_elements();
}