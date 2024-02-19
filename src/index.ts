import { ini_file_to_ini_scene, parse_ini_file } from "./util/parse-ini";
import { load_file } from "./util/load-file";
import { init_three } from "./vis/init_three";
import { parse_obj } from "./util/parse-obj";
import { indexed_triangle_to_halfedge_mesh } from "./geo/halfedge_mesh_from_indexed_triangle";
import { Vertex } from "./geo/atom_vertex";
import { halfedge_mesh_to_index_triangle } from "./geo/halfedge_mesh_to_index_triangle";
import { view_index_triangle, view_index_triangle_wireframe } from "./vis/view_indexed_triangle";
import { halfedge_mesh_flip_edge } from "./geo/halfedge_mesh_flip_edge";
import { halfedge_mesh_edge_split } from "./geo/halfedge_mesh_split_edge";
import { view_halfedge } from "./vis/view_halfedge";
import { Halfedge } from "./geo/atom_halfedge";
import { vertex_get_neighbors } from "./geo/halfedge_mesh_get_vert_neighbors";
import { view_vertex } from "./vis/view_vertex";
import { cycle_list_reverse } from "./util/array";
import { add_vs, smul_v } from "./geo/linalg_standard";
import { loop_subdivision } from "./geo/halfedge_mesh_loop_subdivision";
import { get_elapsed_time, reset_elapsed_time } from "./util/timer";
import { halfedge_mesh_validate } from "./geo/halfedge_mesh_validate";

init_three();

// load_file('/template_inis/final/subdivide_icosahedron_4.ini').then(async (ini_raw_data) => {
load_file('/template_inis/final/simplify_cow.ini').then(async (ini_raw_data) => {
    reset_elapsed_time();
    const ini_file = parse_ini_file(ini_raw_data);
    const data = ini_file_to_ini_scene(ini_file);
    const obj_raw_data = await load_file(data.IO.infile);
    const obj_data = parse_obj(obj_raw_data);

    const mesh = indexed_triangle_to_halfedge_mesh(obj_data.vertices, obj_data.indices);
    console.log(`Loaded 3D model in ${get_elapsed_time()} ms`);

    // halfedge_mesh_flip_edge(mesh, mesh.halfedges[0]);
    // halfedge_mesh_edge_split(mesh, mesh.halfedges[0]);

    loop_subdivision(mesh, 1);
    console.log(`Processed in ${get_elapsed_time(true)} ms`);

    halfedge_mesh_validate(mesh);
    console.log(`Validated in ${get_elapsed_time(true)} ms`);

    const re_convert = halfedge_mesh_to_index_triangle(mesh);
    console.log(`Exported 3D model in ${get_elapsed_time(true)} ms`);

    view_index_triangle(re_convert, 0x00aaff);
    // view_index_triangle_wireframe(re_convert, 0x00aaff);
});