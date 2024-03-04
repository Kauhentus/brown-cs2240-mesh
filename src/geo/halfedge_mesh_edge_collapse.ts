import { view_halfedge } from "../vis/view_halfedge";
import { Edge } from "./atom_edge";
import { Face } from "./atom_face";
import { Halfedge } from "./atom_halfedge";
import { Vertex } from "./atom_vertex";
import { HalfedgeMesh } from "./halfedge_mesh";
import { vertex_get_neighbors } from "./vertex_get_neighbors";

export type EdgeCollapseEvent = {
    failed: boolean,
    vert: Vertex,
    deleted_he: Halfedge[]
}

export const halfedge_mesh_edge_collapse = (
    halfedge_mesh: HalfedgeMesh, he: Halfedge, ignore_checks: boolean,
    input_vertex?: Vertex
): EdgeCollapseEvent => {
    let A = he;
    let B = he.twin;
    let neighbors_A = vertex_get_neighbors(he.vert);
    let neighbors_B = vertex_get_neighbors(he.twin.vert);

    if(!ignore_checks){
        let shared_neighbors = neighbors_A.verts.filter(va => neighbors_B.verts.includes(va));
        let shared_neighbor_degree = shared_neighbors.map((vn, i) => {
            return vertex_get_neighbors(vn).verts.length;
        });

        if(shared_neighbors.length > 2){
            return {
                failed: true,
                vert: he.vert,
                deleted_he: []
            }
        } else if(shared_neighbor_degree.includes(3)){
            return {
                failed: true,
                vert: he.vert,
                deleted_he: []
            }
        }
    }

    // get pointers
    let An = A.next;
    let Bn = B.next;
    let Ann = A.next.next;
    let Bnn = B.next.next;

    let At1 = An.twin;
    let At2 = Ann.twin;
    let Bt1 = Bn.twin;
    let Bt2 = Bnn.twin;

    // delete and join halfedges, reassign pointers
    A.to_delete = true;
    B.to_delete = true;
    An.to_delete = true;
    Bn.to_delete = true;
    Ann.to_delete = true;
    Bnn.to_delete = true;

    At1.twin = At2;
    At2.twin = At1;
    Bt1.twin = Bt2;
    Bt2.twin = Bt1;

    // deal with faces
    A.face.to_delete = true;
    B.face.to_delete = true;

    // deal with vertices
    A.vert.to_delete = true;
    B.vert.to_delete = true;

    Bnn.vert.he = Bt1;
    Ann.vert.he = At1;

    let new_vertex: Vertex;
    if(input_vertex){
        new_vertex = input_vertex;
    } else {
        new_vertex = new Vertex(
            (A.vert.x + B.vert.x) * 0.5,
            (A.vert.y + B.vert.y) * 0.5,
            (A.vert.z + B.vert.z) * 0.5,
        );
    }

    neighbors_A.leaving_halfedges.forEach(lhe => lhe.vert = new_vertex);
    neighbors_B.leaving_halfedges.forEach(lhe => lhe.vert = new_vertex);
    halfedge_mesh.verts.push(new_vertex);
    new_vertex.he = At2;

    return {
        failed: false,
        vert: new_vertex,
        deleted_he: [A, B, An, Bn, Ann, Bnn]
    }
}