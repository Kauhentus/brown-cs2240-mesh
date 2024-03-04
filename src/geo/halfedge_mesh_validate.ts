import { Halfedge } from "./atom_halfedge";
import { HalfedgeMesh } from "./halfedge_mesh";

export const halfedge_mesh_validate = (mesh: HalfedgeMesh) => {
    let test_dictionary = [
        every_halfedge_has_matching_twin,
        every_triangle_has_3_edges,
        num_halfedges_matches_num_faces,
        can_march_around_triangle_pair,

        no_old_vertices,
        no_old_faces,

        every_halfedge_has_vertex,
        every_vertex_has_halfedge,
        every_halfedge_has_face,
        every_face_has_halfedge,

        flags_all_reset,
    ];
    
    let test_results = test_dictionary.map(test => [test(mesh), test.name] as [boolean, string]);
    let num_passing = test_results.filter(r => r[0]).length;

    console.log(`[${(num_passing / test_results.length * 100).toFixed(2)}%] ${num_passing} of ${test_results.length} tests passed`)
    if(num_passing != test_results.length){
        console.log(`Tests failed:`);
        test_results.forEach(r => {
            if(r[0]) return;
            console.log(`  ${r[1]}`);
        });
    }
}

const flags_all_reset = (mesh: HalfedgeMesh): boolean => {
    let vert_flags_reset = mesh.verts.every(v => !v.flag1 && !v.flag2 && !v.flag3 && !v.flag4);
    let he_flags_reset = mesh.halfedges.every(he => !he.flag1 && !he.flag2 && !he.flag3 && !he.flag4)
    return vert_flags_reset && he_flags_reset;
    
}

const no_old_faces = (mesh: HalfedgeMesh): boolean => {
    return mesh.faces.every(f => {
        let he0 = f.he;
        let he1 = he0.next;
        let he2 = he1.next;
        return he0.face === f && he1.face === f && he2.face === f;
    });
}

const no_old_vertices = (mesh: HalfedgeMesh): boolean => {
    return mesh.verts.every(v => {
        return v.he.next.next.next.vert === v;
    });
}

const can_march_around_triangle_pair = (mesh: HalfedgeMesh): boolean => {
    return mesh.halfedges.every(he => {
        let start = he;
        let end = start.next.next.twin.next.next.next.twin.next;
        return start === end;
    });
}

const every_halfedge_has_matching_twin = (mesh: HalfedgeMesh): boolean => {
    return mesh.halfedges.every(he => {
        return he.twin.twin === he
    });
}

const every_triangle_has_3_edges = (mesh: HalfedgeMesh): boolean => {
    return mesh.halfedges.every(he => {
        return he.next.next.next === he
    });
}

const num_halfedges_matches_num_faces = (mesh: HalfedgeMesh): boolean => {
    let num_he = mesh.halfedges.length;
    let num_f = mesh.faces.length;

    return num_he / 3 === num_f;
}

const every_halfedge_has_vertex = (mesh: HalfedgeMesh): boolean => {
    return mesh.halfedges.every(he => he.vert !== undefined);
}

const every_halfedge_has_face = (mesh: HalfedgeMesh): boolean => {
    return mesh.halfedges.every(he => he.face !== undefined);
}

const every_vertex_has_halfedge = (mesh: HalfedgeMesh): boolean => {
    return mesh.verts.every(v => v.he !== undefined);
}

const every_face_has_halfedge = (mesh: HalfedgeMesh): boolean => {
    return mesh.faces.every(f => f.he !== undefined);
}