exports.groupToInt = (area) => {
    if(area == 'action'){
        return 1;
    }else if (area == 'reason'){
        return 2;
    }
};

exports.intToGroup = (area) => {
    if(area == 1){
        return 'action';
    }else if (area == 2){
        return 'reason';
    }
};

exports.capitalize_Words = (str) => {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}