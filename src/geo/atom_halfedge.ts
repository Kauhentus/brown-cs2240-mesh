import { Edge } from "./atom_edge";
import { Face } from "./atom_face";
import { Vertex } from "./atom_vertex";

export class Halfedge {
    twin!: Halfedge;
    next!: Halfedge;

    vert!: Vertex;
    edge!: Edge;
    face!: Face;

    to_delete: boolean;

    flag1: boolean = false;
    flag2: boolean = false;
    flag3: boolean = false;
    flag4: boolean = false;

    constructor(v: Vertex){
        this.vert = v;
        this.to_delete = false;
    }

    set_twin(twin: Halfedge){
        this.twin = twin;
    }

    set_next(next: Halfedge){
        this.next = next;
    }
    
    set_vert(v: Vertex){
        this.vert = v;
    }
    
    set_edge(e: Edge){
        this.edge = e;
    }
    
    set_face(f: Face){
        this.face = f;
    }

    reset_flags(){
        this.flag1 = false;
        this.flag2 = false;
        this.flag3 = false;
        this.flag4 = false;
    }
}