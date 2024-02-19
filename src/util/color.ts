export const rgb_to_hex = (r: number, g: number, b: number) => {
    let r_hex = r.toString(16).padStart(2, '0');
    let g_hex = g.toString(16).padStart(2, '0');
    let b_hex = b.toString(16).padStart(2, '0');
    let hex_str =  `${r_hex}${g_hex}${b_hex}`;
    return parseInt(hex_str, 16);
}