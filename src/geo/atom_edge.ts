import { Halfedge } from "./atom_halfedge";

export class Edge {
    he!: Halfedge;
    to_delete: boolean;
    
    constructor(){
        this.to_delete = false;
    }

    set_he(he: Halfedge){
        this.he = he;
    }
}