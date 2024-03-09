import { ini_file_to_ini_scene, parse_ini_file } from "./util/parse-ini";
import { load_file } from "./util/load-file";
import { camera, controls, init_three, scene } from "./vis/init_three";
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

type Operation = "subdivide" | "decimate" | "remesh" | "filter" | "none";

type UI_Input = {
    selected_operation: Operation,
    selected_file: string,
    checkbox_subdivide: boolean,
    checkbox_decimate: boolean,
    checkbox_remesh: boolean,
    checkbox_filter: boolean,
    checkbox_none: boolean,
    num_subdivision_levels: number,
    decimation_ratio: number,
    num_remesh_levels: number,
    sigma_s: number,
    sigma_c: number
}

const paths: {[key: string]: string} = {
    "cow": `/basic-geometry-processing/meshes/cow.obj`,
    "cow_noisy": `/basic-geometry-processing/meshes/cow_noisy.obj`,
    "icosahedron": `/basic-geometry-processing/meshes/icosahedron.obj`,
    "moomoo": `/basic-geometry-processing/meshes/moomoo.obj`,
    "peter": `/basic-geometry-processing/meshes/peter.obj`,
    "peter_noisy": `/basic-geometry-processing/meshes/peter_noisy.obj`,
    "sphere": `/basic-geometry-processing/meshes/sphere.obj`,
    "teapot": `/basic-geometry-processing/meshes/teapot.obj`,
}

const initialize_UI = () => {
    let selected_operation: Operation = "subdivide";
    const input_file = document.getElementById('file-selector') as HTMLInputElement;
    const input_checkbox_subdivide = document.getElementById('checkbox-subdivide') as HTMLInputElement;
    const input_checkbox_decimate = document.getElementById('checkbox-decimate') as HTMLInputElement;
    const input_checkbox_remesh = document.getElementById('checkbox-remesh') as HTMLInputElement;
    const input_checkbox_filter = document.getElementById('checkbox-filter') as HTMLInputElement;
    const input_checkbox_none = document.getElementById('checkbox-none') as HTMLInputElement;
    const input_num_subdivision_levels = document.getElementById('num-subdivision-levels') as HTMLInputElement;
    const input_decimation_ratio = document.getElementById('decimation-ratio') as HTMLInputElement;
    const input_num_remesh_levels = document.getElementById('num-remesh-levels') as HTMLInputElement;
    const input_sigma_s = document.getElementById('sigma-s') as HTMLInputElement;
    const input_sigma_c = document.getElementById('sigma-c') as HTMLInputElement;

    const change_og_triangle_num = (n: number, highlight: boolean) => {
        const div = document.getElementById('og_tri_count');
        if(highlight){
            if(div) div.innerHTML = `<font style="color: red;"><b>Original triangle count: ${n}</b></font>`;
        }
        else {
            if(div) div.innerHTML = `Original triangle count: ${n}`;
        }
    }

    const change_new_triangle_num = (n: number | string, highlight: boolean) => {
        const div = document.getElementById('new_tri_count');
        if(highlight){
            if(div) div.innerHTML = `<font style="color: red;"><b>Triangle count after operation: ${n}</b></font>`;
        } else {
            if(div) div.innerHTML = `Triangle count after operation: ${n}`;
        }
    }

    const get_current_values = (): UI_Input => {
        const checkbox_subdivide = input_checkbox_subdivide.checked;
        const checkbox_decimate = input_checkbox_decimate.checked;
        const checkbox_remesh = input_checkbox_remesh.checked;
        const checkbox_filter = input_checkbox_filter.checked;
        const checkbox_none = input_checkbox_none.checked;
        const num_subdivision_levels = input_num_subdivision_levels.value; 
        const decimation_ratio = input_decimation_ratio.value; 
        const num_remesh_levels = input_num_remesh_levels.value; 
        const sigma_s = input_sigma_s.value; 
        const sigma_c = input_sigma_c.value; 

        if(checkbox_subdivide) selected_operation = "subdivide";
        else if(checkbox_decimate) selected_operation = "decimate";
        else if(checkbox_remesh) selected_operation = "remesh";
        else if(checkbox_filter) selected_operation = "filter";
        else selected_operation = "none";
    
        return {
            selected_file: input_file.value,
            selected_operation: selected_operation,
            checkbox_subdivide: checkbox_subdivide,
            checkbox_decimate: checkbox_decimate,
            checkbox_remesh: checkbox_remesh,
            checkbox_filter: checkbox_filter,
            checkbox_none: checkbox_none,

            num_subdivision_levels: parseFloat(num_subdivision_levels),
            decimation_ratio: parseFloat(decimation_ratio),
            num_remesh_levels: parseFloat(num_remesh_levels),
            sigma_s: parseFloat(sigma_s),
            sigma_c: parseFloat(sigma_c)
        }
    }

    let threshold = 100000;
    let prev_objects: THREE.Object3D[] = [];
    let prev_file = '';
    const on_value_update = async () => {
        const input_data = get_current_values();
        console.log(input_data);

        load_file(paths[input_data.selected_file]).then(async (raw_obj_data) => {
            const obj_data = parse_obj(raw_obj_data);

            const mesh = indexed_triangle_to_halfedge_mesh(obj_data.vertices, obj_data.indices);
            console.log(`Loaded 3D model in ${get_elapsed_time()} ms`);

            prev_objects.forEach(o => scene.remove(o));
            prev_objects = [];
            
            let target_num = mesh.faces.length;
            let target_num_str: number | string = mesh.faces.length;
            if(input_data.selected_operation === 'subdivide'){
                target_num *= 4 ** input_data.num_subdivision_levels;
                target_num_str *= 4 ** input_data.num_subdivision_levels;
            } else if(input_data.selected_operation === 'decimate'){
                target_num *= input_data.decimation_ratio;
                target_num_str *= input_data.decimation_ratio;

                target_num = Math.round(target_num);
                target_num_str = Math.round(target_num_str);
            } else if(input_data.selected_operation === 'remesh'){
                target_num *= 1.5;
                target_num_str = `~${target_num}`;
            }

            if(input_data.selected_operation === 'decimate'){
                let max_starting_triangles = 10000;
                let valid = max_starting_triangles > mesh.faces.length;
                
                change_og_triangle_num(mesh.faces.length, !valid);
                change_new_triangle_num(target_num_str, target_num > threshold);
                if(!valid){
                    return;
                }
            } else {
                change_og_triangle_num(mesh.faces.length, false)
                change_new_triangle_num(target_num_str, target_num > threshold);
                if(target_num > threshold){
                    return;
                }
            }
  
            let file_changed = input_data.selected_file !== prev_file;
            prev_file = input_data.selected_file;

            if(file_changed){
                if(
                    input_data.selected_file === "cow" ||
                    input_data.selected_file === "cow_noisy"
                ){
                    camera.position.set(13 + 2, 9, -1);
                    controls.target.set(0, 9, -1);
                    controls.update();
                } else if(
                    input_data.selected_file === "peter" ||
                    input_data.selected_file === "peter_noisy"
                ){
                    camera.position.set(-140, 185, 0);
                    controls.target.set(0, 40, 0);
                    controls.update();
                } else if(
                    input_data.selected_file === 'icosahedron'
                ){
                    camera.position.set(1, 0.5, 0);
                    controls.target.set(0, 0, 0);
                    controls.update(); 
                } else if(
                    input_data.selected_file === 'moomoo'
                ){
                    camera.position.set(0, 15, 30);
                    controls.target.set(0, 20, 0);
                    controls.update(); 
                } else if(
                    input_data.selected_file === 'teapot'
                ){
                    camera.position.set(0, 2, 6);
                    controls.target.set(0, 1, 0);
                    controls.update(); 
                }
            }

            if(input_data.selected_operation === 'none'){
                // do nothing!
            }

            if(input_data.selected_operation === 'decimate'){
                decimate(mesh, mesh.faces.length * input_data.decimation_ratio);
            }

            else if(input_data.selected_operation === 'subdivide'){
                loop_subdivision(mesh, input_data.num_subdivision_levels);
            }

            else if(input_data.selected_operation === 'filter'){
                let f = input_data.sigma_s;
                let c = input_data.sigma_c;
                halfedge_mesh_denoise(mesh, 0.5 * f, 0.25 * f, c * f)
            }

            else if(input_data.selected_operation === 'remesh'){
                halfedge_mesh_remesh(mesh, input_data.num_remesh_levels, 0.5);
            }

            console.log("finished with", mesh.faces.length, "faces")
            console.log(`Processed in ${get_elapsed_time(true)} ms`);

            halfedge_mesh_validate(mesh);
            console.log(`Validated in ${get_elapsed_time(true)} ms`);

            const re_convert = halfedge_mesh_to_index_triangle(mesh);
            console.log(`Exported 3D model in ${get_elapsed_time(true)} ms`);

            let view_objs = view_index_triangle(re_convert, 0x00aaff);
            prev_objects.push(...view_objs.objects);
        });
    }

    const unique_checkbox = (checkbox: HTMLInputElement) => {
        if(checkbox !== input_checkbox_subdivide) input_checkbox_subdivide.checked = false;
        if(checkbox !== input_checkbox_decimate) input_checkbox_decimate.checked = false;
        if(checkbox !== input_checkbox_remesh) input_checkbox_remesh.checked = false;
        if(checkbox !== input_checkbox_filter) input_checkbox_filter.checked = false;
        if(checkbox !== input_checkbox_none) input_checkbox_none.checked = false;
    }

    input_file.addEventListener('change', on_value_update)
    input_checkbox_subdivide.addEventListener('change', () => (unique_checkbox(input_checkbox_subdivide), on_value_update()))
    input_checkbox_decimate.addEventListener('change', () => (unique_checkbox(input_checkbox_decimate), on_value_update()))
    input_checkbox_remesh.addEventListener('change', () => (unique_checkbox(input_checkbox_remesh), on_value_update()))
    input_checkbox_filter.addEventListener('change', () => (unique_checkbox(input_checkbox_filter), on_value_update()))
    input_checkbox_none.addEventListener('change', () => (unique_checkbox(input_checkbox_none), on_value_update()))
    
    input_num_subdivision_levels.addEventListener('change', on_value_update)
    input_decimation_ratio.addEventListener('change', on_value_update)
    input_num_remesh_levels.addEventListener('change', on_value_update)
    input_sigma_s.addEventListener('change', on_value_update)
    input_sigma_c.addEventListener('change', on_value_update)

    on_value_update();
}
initialize_UI();

// // load_file('/template_inis/final/subdivide_icosahedron_4.ini').then(async (ini_raw_data) => {
// load_file('/template_inis/final/simplify_cow.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/simplify_sphere_full.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/filter_peter.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/filter_peter_noisy.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/filter_cow_noisy.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/remesh_cow_fine.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/remesh_peter.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/view_peter_noisy.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/view_cow_fine.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/view_cow_noisy.ini').then(async (ini_raw_data) => {
// // load_file('/template_inis/final/view_peter.ini').then(async (ini_raw_data) => {
//         reset_elapsed_time();
//     const ini_file = parse_ini_file(ini_raw_data);
//     const data = ini_file_to_ini_scene(ini_file);
//     const obj_raw_data = await load_file(data.IO.infile);
//     const obj_data = parse_obj(obj_raw_data);

//     const mesh = indexed_triangle_to_halfedge_mesh(obj_data.vertices, obj_data.indices);
//     console.log(`Loaded 3D model in ${get_elapsed_time()} ms`);

//     if(true){
//         if(data.Method.method === 'none'){
//             // do nothing!
//         }

//         if(data.Method.method === 'simplify'){
//             decimate(mesh, mesh.faces.length - data.Parameters.args1);
//         }

//         else if(data.Method.method === 'subdivide'){
//             loop_subdivision(mesh, data.Parameters.args1);
//         }

//         else if(data.Method.method === 'filter'){
//             let f = data.Parameters.args1;
//             halfedge_mesh_denoise(mesh, 0.5 * f, 0.25 * f, 0.1 * f)
//         }

//         else if(data.Method.method === 'remesh'){
//             halfedge_mesh_remesh(mesh, data.Parameters.args1, 0.5);
//         }
//     } 
    
//     else {
//         // halfedge_mesh_edge_flip(mesh, mesh.halfedges[0], false);   
//         // mesh.cull_old_elements();
//         // mesh.reset_halfedge_flags(); 
//         // halfedge_mesh_edge_split(mesh, mesh.halfedges[0]);
//         // mesh.cull_old_elements();
//         // mesh.reset_halfedge_flags();
//         // halfedge_mesh_edge_collapse(mesh, mesh.halfedges[0], false);
//         // mesh.cull_old_elements();
//         // mesh.reset_halfedge_flags();

//         // decimate(mesh, 5802 - 5204);
//         // loop_subdivision(mesh, 2);
//         // decimate(mesh, 4);

//         // loop_subdivision(mesh, 1);
//         // let f = 1.5;
//         // halfedge_mesh_add_noise(mesh, 0.1 * f);
//         // halfedge_mesh_denoise(mesh, 0.5 * f, 0.25 * f, 0.1 * f);

//         loop_subdivision(mesh, 1);
//         // halfedge_mesh_remesh(mesh, 2, 0.5);
//     } 

//     console.log("finished with", mesh.faces.length, "faces")
//     console.log(`Processed in ${get_elapsed_time(true)} ms`);

//     halfedge_mesh_validate(mesh);
//     console.log(`Validated in ${get_elapsed_time(true)} ms`);

//     const re_convert = halfedge_mesh_to_index_triangle(mesh);
//     console.log(`Exported 3D model in ${get_elapsed_time(true)} ms`);

//     view_index_triangle(re_convert, 0x00aaff);
//     // view_index_triangle_wireframe(re_convert, 0x00aaff);

//     // download_obj(re_convert);
// });