import { Halfedge } from "./atom_halfedge";

let c = 0;

export class Vertex {
    x!: number;
    y!: number;
    z!: number;

    he!: Halfedge;
    id: symbol;

    flag1: boolean = false;
    flag2: boolean = false;
    flag3: boolean = false;
    flag4: boolean = false;

    cache1: any;
    cache2: any;
    cache3: any;
    cache4: any;

    constructor(x?: number , y?: number, z?: number){
        if(x !== undefined) this.x = x;
        if(y !== undefined) this.y = y;
        if(z !== undefined) this.z = z;

        this.id = Symbol(c++);
    }
    
    set_pos(x: number, y: number, z: number){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set_he(he: Halfedge){
        this.he = he;
    }

    to_THREE(){
        return [this.x, this.y, this.z];
    }

    reset_flags(){
        this.flag1 = false;
        this.flag2 = false;
        this.flag3 = false;
        this.flag4 = false;
    }
}