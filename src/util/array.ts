export const cycle_list = (arr: any[], times: number) => {
    for(let i = 0; i < times; i++){
        let temp = arr.pop();
        arr.unshift(temp);
    }
}

export const cycle_list_reverse = (arr: any[], times: number) => {
    for(let i = 0; i < times; i++){
        let temp = arr.shift();
        arr.push(temp);
    }
}