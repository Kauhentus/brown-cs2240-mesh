export type IniFile = {
    [key: string]: IniCategory;
}

export type IniCategory = {
    [key: string]: string;
};

export const parse_ini_file = (raw_file: string): IniFile => {
    let init_lines = raw_file.split('\n');
    let category_groups: IniFile = {};
    let current_group: IniCategory = {};

    for(let line of init_lines){
        if(line[0] === '['){
            let category_name = line.match(/(?<=\[).+?(?=\])/);
            let name = category_name ? category_name[0].trim() : "";
            category_groups[name] = {};
            current_group = category_groups[name];
        } 
        
        else {
            if(line.indexOf('=') === -1) continue;
            let field_name = line.match(/(?:(?!=).)*/);
            let field_data = line.match(/(?<==).*/);
            let name = field_name ? field_name[0].trim() : "";
            let data = field_data ? field_data[0].trim() : "";
            current_group[name] = data;
        }
    }
    
    return category_groups;
}

export const ini_file_to_ini_scene = (file: IniFile): IniFileScene => {
    try {
        return {
            IO: {
                infile: file["IO"]["infile"],
                outfile: file["IO"]["outfile"]
            },
        
            Method: {
                method: file["Method"]["method"],
            },
        
            Parameters: {
                args1: parseFloat(file["Parameters"]["args1"])
            }
        }
    } catch(e) {
        throw Error("Error in ini file to ini scene file conversion");
    }
}

export type IniFileScene = {
    IO: {
        infile: string,
        outfile: string
    };

    Method: {
        method: string,
    };

    Parameters: {
        args1: number
    };
}