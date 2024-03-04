import { view_halfedge } from "../vis/view_halfedge";
import { Edge } from "./atom_edge";
import { Face } from "./atom_face";
import { Halfedge } from "./atom_halfedge";
import { HalfedgeMesh } from "./halfedge_mesh";
import { vertex_get_neighbors } from "./vertex_get_neighbors";

export type EdgeFlipEvent = {
    failed: boolean,
    halfedges: Halfedge[];
    faces: Face[];
}

export const halfedge_mesh_edge_flip = (halfedge_mesh: HalfedgeMesh, he: Halfedge, ignore_checks: boolean): EdgeFlipEvent => {
    if(!ignore_checks){
        let neighbors_A = vertex_get_neighbors(he.vert);
        let neighbors_B = vertex_get_neighbors(he.next.vert);
        let invalid_3_neighbor = neighbors_A.verts.length === 3 || neighbors_B.verts.length === 3;
        if(invalid_3_neighbor){
            return {
                failed: true,
                halfedges: [],
                faces: []
            }
        }
    }

    // get pointers
    let A = he;
    let B = he.twin;
    let An = A.next;
    let Bn = B.next;
    let Ann = A.next.next;
    let Bnn = B.next.next;

    // create new halfedges and reassign pointers
    let C = new Halfedge(Ann.vert);
    let D = new Halfedge(Bnn.vert);
    halfedge_mesh.halfedges.push(C, D);
    C.twin = D; 
    D.twin = C;

    An.next = C;
    C.next = Bnn;
    Bnn.next = An;

    Bn.next = D;
    D.next = Ann;
    Ann.next = Bn;

    A.to_delete = true;
    B.to_delete = true;

    // deal with faces
    let fc = new Face();
    let fd = new Face();
    halfedge_mesh.faces.push(fc, fd);
    fc.he = C;
    fd.he = D;    

    C.face = fc;
    Bnn.face = fc;
    An.face = fc;

    D.face = fd;
    Ann.face = fd;
    Bn.face = fd;

    A.face.to_delete = true;
    B.face.to_delete = true;

    // deal with vertex he pointers
    C.vert.he = C;
    D.vert.he = D;

    A.vert.he = Bn;
    B.vert.he = An;

    return {
        failed: false,
        halfedges: [C, D],
        faces: [fc, fd]
    }
}