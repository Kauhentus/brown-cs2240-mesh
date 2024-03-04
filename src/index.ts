import { ini_file_to_ini_scene, parse_ini_file } from "./util/parse-ini";
import { load_file } from "./util/load-file";
import { init_three } from "./vis/init_three";
import { parse_obj } from "./util/parse-obj";
import { indexed_triangle_to_halfedge_mesh } from "./geo/halfedge_mesh_from_indexed_triangle";
import { Vertex } from "./geo/atom_vertex";
import { halfedge_mesh_to_index_triangle } from "./geo/halfedge_mesh_to_index_triangle";
import { view_index_triangle, view_index_triangle_wireframe } from "./vis/view_indexed_triangle";
import { halfedge_mesh_edge_flip } from "./geo/halfedge_mesh_edge_flip";
import { halfedge_mesh_edge_split } from "./geo/halfedge_mesh_edge_split";
import { view_halfedge } from "./vis/view_halfedge";
import { Halfedge } from "./geo/atom_halfedge";
import { vertex_get_neighbors } from "./geo/vertex_get_neighbors";
import { view_vertex } from "./vis/view_vertex";
import { cycle_list_reverse } from "./util/array";
import { add_vs, smul_v } from "./geo/linalg_standard";
import { loop_subdivision } from "./geo/halfedge_mesh_loop_subdivision";
import { get_elapsed_time, reset_elapsed_time } from "./util/timer";
import { halfedge_mesh_validate } from "./geo/halfedge_mesh_validate";
import { halfedge_mesh_edge_collapse } from "./geo/halfedge_mesh_edge_collapse";
import { decimate } from "./geo/halfedge_mesh_decimate";
import { halfedge_mesh_add_noise } from "./geo/halfedge_mesh_add_noise";
import { halfedge_mesh_denoise } from "./geo/halfedge_mesh_denoise";
import { halfedge_mesh_remesh } from "./geo/halfedge_mesh_remesh";
import { download_obj } from "./util/download_obj";

init_three();

// load_file('/template_inis/final/subdivide_icosahedron_4.ini').then(async (ini_raw_data) => {
load_file('/template_inis/final/simplify_cow.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/simplify_sphere_full.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/filter_peter.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/filter_peter_noisy.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/filter_cow_noisy.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/remesh_cow_fine.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/remesh_peter.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/view_peter_noisy.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/view_cow_fine.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/view_cow_noisy.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/view_peter.ini').then(async (ini_raw_data) => {
        reset_elapsed_time();
    const ini_file = parse_ini_file(ini_raw_data);
    const data = ini_file_to_ini_scene(ini_file);
    const obj_raw_data = await load_file(data.IO.infile);
    const obj_data = parse_obj(obj_raw_data);

    const mesh = indexed_triangle_to_halfedge_mesh(obj_data.vertices, obj_data.indices);
    console.log(`Loaded 3D model in ${get_elapsed_time()} ms`);

    if(true){
        if(data.Method.method === 'none'){
            // do nothing!
        }

        if(data.Method.method === 'simplify'){
            decimate(mesh, mesh.faces.length - data.Parameters.args1);
        }

        else if(data.Method.method === 'subdivide'){
            loop_subdivision(mesh, data.Parameters.args1);
        }

        else if(data.Method.method === 'filter'){
            let f = data.Parameters.args1;
            halfedge_mesh_denoise(mesh, 0.5 * f, 0.25 * f, 0.1 * f)
        }

        else if(data.Method.method === 'remesh'){
            halfedge_mesh_remesh(mesh, data.Parameters.args1, 0.5);
        }
    } 
    
    else {
        // halfedge_mesh_edge_flip(mesh, mesh.halfedges[0], false);   
        // mesh.cull_old_elements();
        // mesh.reset_halfedge_flags(); 
        // halfedge_mesh_edge_split(mesh, mesh.halfedges[0]);
        // mesh.cull_old_elements();
        // mesh.reset_halfedge_flags();
        // halfedge_mesh_edge_collapse(mesh, mesh.halfedges[0], false);
        // mesh.cull_old_elements();
        // mesh.reset_halfedge_flags();

        // decimate(mesh, 5802 - 5204);
        // loop_subdivision(mesh, 2);
        // decimate(mesh, 4);

        // loop_subdivision(mesh, 1);
        // let f = 1.5;
        // halfedge_mesh_add_noise(mesh, 0.1 * f);
        // halfedge_mesh_denoise(mesh, 0.5 * f, 0.25 * f, 0.1 * f);

        loop_subdivision(mesh, 1);
        // halfedge_mesh_remesh(mesh, 2, 0.5);
    } 

    console.log("finished with", mesh.faces.length, "faces")
    console.log(`Processed in ${get_elapsed_time(true)} ms`);

    halfedge_mesh_validate(mesh);
    console.log(`Validated in ${get_elapsed_time(true)} ms`);

    const re_convert = halfedge_mesh_to_index_triangle(mesh);
    console.log(`Exported 3D model in ${get_elapsed_time(true)} ms`);

    view_index_triangle(re_convert, 0x00aaff);
    // view_index_triangle_wireframe(re_convert, 0x00aaff);

    // download_obj(re_convert);
});