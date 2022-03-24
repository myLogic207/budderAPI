const utils = {};

utils.isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        try {
            JSON.stringify(str);
        } catch (e) {
            return false;            
        }
    }
    return true;
}

module.exports = utils;