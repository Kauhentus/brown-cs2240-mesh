import { HalfedgeMesh } from "./halfedge_mesh";
import { halfedge_mesh_edge_collapse } from "./halfedge_mesh_edge_collapse";
import { halfedge_mesh_edge_flip } from "./halfedge_mesh_edge_flip";
import { halfedge_mesh_edge_split } from "./halfedge_mesh_edge_split";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { vertex_get_normal } from "./vertex_get_normal";
import { add_v, avg_v, distance_v, dot_v, smul_v, sub_v } from "./linalg_standard";

export const halfedge_mesh_remesh = (mesh: HalfedgeMesh, iterations: number, w: number) => {
    if(iterations === 0) return;
    for(let i = 0; i < iterations; i++){
        halfedge_mesh_remesh_helper(mesh, w);
    }
}

const halfedge_mesh_remesh_helper = (mesh: HalfedgeMesh, w: number) => {
    mesh.reset_halfedge_flags();
    let mean_edge_length_sum = 0;
    mesh.halfedges.forEach(he => {
        let A = he.vert, B = he.twin.vert;
        let length = distance_v(A, B);
        mean_edge_length_sum += length;
    });
    let mean_edge_length = mean_edge_length_sum / mesh.halfedges.length;

    // stage 1: SPLIT
    mesh.halfedges.forEach(he => {
        if(he.flag1) return;

        let A = he.vert, B = he.twin.vert;
        let length = distance_v(A, B);
        
        if(length > 4/3 * mean_edge_length){
            halfedge_mesh_edge_split(mesh, he);
            he.flag1 = true;
            he.twin.flag1 = true;
        }
    });
    mesh.cull_old_elements();
    mesh.reset_halfedge_flags();

    // stage 2: COLLAPSE
    mesh.halfedges.forEach(he => {
        if(he.flag1) return;

        let A = he.vert, B = he.twin.vert;
        let length = distance_v(A, B);
        
        if(length < 4/5 * mean_edge_length){ // should be 4/5
            let event = halfedge_mesh_edge_collapse(mesh, he, false);
            he.flag1 = true;
            he.twin.flag1 = true;
            event.deleted_he.map(he2 => he2.flag1 = true);
        }
    });
    mesh.cull_old_elements();
    mesh.reset_halfedge_flags();

    // stage 3: FLIP
    mesh.halfedges.forEach(he => {
        if(he.flag1) return;

        let A = he.vert;
        let B = he.twin.vert;
        let C = he.next.next.vert;
        let D = he.twin.next.next.vert;

        let degree_A = vertex_get_neighbors(A).verts.length;
        let degree_B = vertex_get_neighbors(B).verts.length;
        let degree_C = vertex_get_neighbors(C).verts.length;
        let degree_D = vertex_get_neighbors(D).verts.length;

        let cur_AB_deviation = Math.abs(degree_A - 6) + Math.abs(degree_B - 6);
        let cur_CD_deviation = Math.abs(degree_C - 6) + Math.abs(degree_D - 6);
        let new_AB_deviation = Math.abs(degree_A - 1 - 6) + Math.abs(degree_B - 1 - 6);
        let new_CD_deviation = Math.abs(degree_C + 1 - 6) + Math.abs(degree_D + 1 - 6);
        let cur_dev = cur_AB_deviation + cur_CD_deviation;
        let new_dev = new_AB_deviation + new_CD_deviation;

        if(new_dev < cur_dev){
            halfedge_mesh_edge_flip(mesh, he, false);
            he.flag1 = true;
            he.twin.flag1 = true;
        }
    });
    mesh.cull_old_elements();
    mesh.reset_halfedge_flags();

    // stage 4: RECENTER
    mesh.verts.forEach(v => {
        let normal = vertex_get_normal(v, true);
        let neighborhood = vertex_get_neighbors(v);
        let centroid = avg_v(...neighborhood.verts);
        let diff = sub_v(centroid, v);
        let diff_tangent = sub_v(diff, smul_v(normal, dot_v(normal, diff)));
        let new_pos = add_v(v, smul_v(diff_tangent, w));
        v.cache1 = new_pos;
    });
    mesh.verts.forEach(v => {
        v.x = v.cache1.x;
        v.y = v.cache1.y;
        v.z = v.cache1.z;
    });
}