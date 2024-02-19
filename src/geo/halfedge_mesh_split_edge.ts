import { view_halfedge } from "../vis/view_halfedge";
import { Edge } from "./atom_edge";
import { Face } from "./atom_face";
import { Halfedge } from "./atom_halfedge";
import { Vertex } from "./atom_vertex";
import { HalfedgeMesh } from "./halfedge_mesh";

export type EdgeSplitEvent = {
    vert: Vertex;
    faces: Face[];
    halfedges: Halfedge[];
    new_halfedges: Halfedge[];
    replaced_halfedges: Halfedge[];
}

export const halfedge_mesh_edge_split = (halfedge_mesh: HalfedgeMesh, he: Halfedge): EdgeSplitEvent => {
    // get pointers
    let A = he;
    let B = he.twin;
    let An = A.next;
    let Bn = B.next;
    let Ann = A.next.next;
    let Bnn = B.next.next;

    // create new vertex, edges, and pointers
    let v = new Vertex(
        (A.vert.x + B.vert.x) * 0.5,
        (A.vert.y + B.vert.y) * 0.5,
        (A.vert.z + B.vert.z) * 0.5,
    );
    halfedge_mesh.verts.push(v);

    let o_fr_A = new Halfedge(v);
    let o_to_A = new Halfedge(A.vert);
    let n_fr_A = new Halfedge(v);
    let n_to_A = new Halfedge(Ann.vert);

    let o_fr_B = new Halfedge(v);
    let o_to_B = new Halfedge(B.vert);
    let n_fr_B = new Halfedge(v);
    let n_to_B = new Halfedge(Bnn.vert);
    halfedge_mesh.halfedges.push(
        o_fr_A, o_to_A, n_fr_A, n_to_A, 
        o_fr_B, o_to_B, n_fr_B, n_to_B
    );

    o_fr_A.twin = o_to_B; o_to_B.twin = o_fr_A;
    o_to_A.twin = o_fr_B; o_fr_B.twin = o_to_A;
    n_to_A.twin = n_fr_A; n_fr_A.twin = n_to_A;
    n_to_B.twin = n_fr_B; n_fr_B.twin = n_to_B;

    o_fr_A.next = An;
    An.next = n_to_A;
    n_to_A.next = o_fr_A;

    o_to_A.next = n_fr_A;
    n_fr_A.next = Ann;
    Ann.next = o_to_A;

    o_fr_B.next = Bn;
    Bn.next = n_to_B;
    n_to_B.next = o_fr_B;

    o_to_B.next = n_fr_B;
    n_fr_B.next = Bnn;
    Bnn.next = o_to_B;

    A.to_delete = true;
    B.to_delete = true;

    // deal with faces
    let fa_to = new Face();
    let fa_fr = new Face();
    let fb_to = new Face();
    let fb_fr = new Face();
    halfedge_mesh.faces.push(fa_to, fa_fr, fb_to, fb_fr);
    fa_fr.he = o_fr_A;
    fa_to.he = o_to_A;
    fb_fr.he = o_fr_B;
    fb_to.he = o_to_B;

    o_fr_A.face = fa_fr; 
    An.face = fa_fr;
    n_to_A.face = fa_fr; 

    o_to_A.face = fa_to;
    n_fr_A.face = fa_to;
    Ann.face = fa_to;

    o_fr_B.face = fb_fr;
    Bn.face = fb_fr;
    n_to_B.face = fb_fr; 

    o_to_B.face = fb_to;
    n_fr_B.face = fb_to;
    Bnn.face = fb_to;

    A.face.to_delete = true;
    B.face.to_delete = true;

    // deal with vertices
    v.he = n_fr_A;

    A.vert.he = o_to_A;
    B.vert.he = o_to_B;

    return {
        vert: v,
        faces: [fa_to, fa_fr, fb_to, fb_fr],
        halfedges: [o_fr_A, o_to_A, n_fr_A, n_to_A, o_fr_B, o_to_B, n_fr_B, n_to_B],
        new_halfedges: [n_fr_A, n_to_A, n_fr_B, n_to_B],
        replaced_halfedges: [o_fr_A, o_to_A, o_fr_B, o_to_B],
    }
}