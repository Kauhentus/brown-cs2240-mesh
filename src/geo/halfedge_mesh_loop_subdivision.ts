import { cycle_list_reverse } from "../util/array";
import { Halfedge } from "./atom_halfedge";
import { Vertex } from "./atom_vertex";
import { HalfedgeMesh } from "./halfedge_mesh";
import { halfedge_mesh_edge_flip } from "./halfedge_mesh_edge_flip";
import { vertex_get_neighbors } from "./vertex_get_neighbors";
import { halfedge_mesh_edge_split } from "./halfedge_mesh_edge_split";
import { add_vs, smul_v } from "./linalg_standard";

export const loop_subdivision = (mesh: HalfedgeMesh, iterations: number) => {
    if(iterations === 0) return;
    for(let i = 0; i < iterations; i++){
        loop_subdivision_helper(mesh);
    }
}

const loop_subdivision_helper = (mesh: HalfedgeMesh) => {
    mesh.reset_flags();

    let current_verts: Vertex[] = [];
    let current_halfedges: Halfedge[] = [];

    // split every edge once
    current_halfedges = mesh.get_halfedge_snapshot();
    current_halfedges.forEach(he => {
        if(he.flag1) return; // flag1 = edge split
        let result = halfedge_mesh_edge_split(mesh, he);
        he.flag1 = true;
        he.twin.flag1 = true;

        result.vert.flag1 = true;
        result.new_halfedges.forEach(he => he.flag2 = true); // flag2 = new edge
    });
    mesh.cull_old_elements();
    mesh.reset_halfedge_flags_n(1);

    // flip every halfedge between one new and one old vertex
    current_halfedges = mesh.get_halfedge_snapshot();
    current_halfedges.forEach(he => {
        if(he.flag1) return;
        if(!he.flag2) return;

        if(he.vert.flag1 != he.next.vert.flag1){
            // doesn't need to check because by our splitting scheme, every vertex has 6 neighbors, 
            // let result = halfedge_mesh_flip_edge(mesh, he, true);
            // if(result.failed) throw new Error("failed to flip due to 3-neighbor");

            halfedge_mesh_edge_flip(mesh, he, false);
            he.flag1 = true;
            he.twin.flag1 = true;
        }
    });
    mesh.cull_old_elements();
    mesh.reset_halfedge_flags();

    // calculate old and new vertex positions
    current_verts = mesh.get_vertex_snapshot();
    current_verts.forEach(v => {
        if(v.flag1){ // new vertex
            let neighbors = vertex_get_neighbors(v);
            let verts = neighbors.verts;
            let leaving_halfedges = neighbors.leaving_halfedges;
            if(verts.length !== 6) throw Error('loop subdivision encountered new vertex w/ non-6 neighbors')

            let cycle_offset = verts.findIndex(v => !v.flag1)
            cycle_list_reverse(verts, cycle_offset);
            cycle_list_reverse(leaving_halfedges, cycle_offset);
            let v0 = verts[0];
            let v2 = verts[3];
            let v1 = leaving_halfedges[2].next.twin.next.next.vert;
            let v3 = leaving_halfedges[5].next.twin.next.next.vert;

            let new_pos = add_vs(
                smul_v(v0, 3 / 8), 
                smul_v(v2, 3 / 8), 
                smul_v(v1, 1 / 8), 
                smul_v(v3, 1 / 8), 
            );
            v.cache1 = new_pos;
        } 

        else { // old vertex
            let neighbors = vertex_get_neighbors(v);
            let neighboring_old_vs: Vertex[] = [];
            for(let he of neighbors.leaving_halfedges){
                let next_he = he.next.twin.next.twin.next; // second he on edge
                let neighbor_old_v = next_he.next.vert;
                neighboring_old_vs.push(neighbor_old_v);
            }

            let n = neighboring_old_vs.length;
            let u = n == 3 ? 3/16 :
                (1/n) * (5/8 - (3/8 + 1/4 * Math.cos(2 * Math.PI / n)) ** 2);
            let weighed_neighbors = neighboring_old_vs.map(v => smul_v(v, u));
            let new_pos = add_vs(
                ...weighed_neighbors,
                smul_v(v, 1 - n * u)
            );
            v.cache1 = new_pos;
        }
    });
    
    // update old vertex positions
    current_verts.forEach(v => { 
        let new_pos = v.cache1 as Vertex;
        v.set_pos(new_pos.x, new_pos.y, new_pos.z);
    });
    
    mesh.reset_flags();
}