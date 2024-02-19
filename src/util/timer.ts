let time_keeper = new Date().getTime();

export const reset_elapsed_time = () => {
    time_keeper = new Date().getTime();
}

export const get_elapsed_time = (reset: boolean = false) => {
    let new_time = new Date().getTime();
    let elapsed_time = new_time - time_keeper;
    if(reset) reset_elapsed_time();
    return elapsed_time;
}