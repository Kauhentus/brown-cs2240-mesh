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

export const chunk_into_3s = (arr: any[]) => {
    let result = [];
    for(let i = 0; i < arr.length; i += 3){
        result.push([
            arr[i], arr[i + 1], arr[i + 2]
        ]);
    }
    return result;
}