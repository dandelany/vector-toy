import _ from 'lodash';
import Http from 'superagent';

export const funcBeginRegEx =  /^\s*function\s*\w*\(([\w,\s]*[\n\/\*]*)\)\s*\{[\s\n]*/; // 'function(a,b,c) { '
export const funcEndRegEx = /\s*}\s*$/; // ' } '

export function unwrapFuncStr(funcStr) {
    // peel the "function() {}" wrapper off of a function string (to make an 'internal function string')
    return funcStr.replace(funcBeginRegEx, '').replace(funcEndRegEx, '')
}

export function urlify(obj, preserveWhitespace = true) {
    // given a nested JS object which may contain functions
    // encode it into a URL-safe string
    const objCopy = _.cloneDeep(obj);
    objCopy.funcStrs = [];
    _.forEach(objCopy, (val, key) => {
        if(!_.isFunction(val)) return;
        let str = val.toString();
            //.replace(/(\{)\n\t(\s+)/g, '{\n ')
            //.replace(/\n\t(\s+)(\})/g, '\n }');
        objCopy[key] = preserveWhitespace ? str : str.replace(/\s+/g, ' ');
        objCopy.funcStrs.push(key); // save functions as strings, and note which so we can undo
    });

    const objStr = JSON.stringify(objCopy);
    // base64 encode it, shorter than query string encoding
    return btoa(objStr);
}

export function deurlify(str) {
    const objStr = atob(str);
    const obj = JSON.parse(objStr);

    _.forEach(obj.funcStrs || [], funcStrKey => {
        // slightly nicer way to make a function from a string than eval(). only slightly.
        try {
            var funcStr = obj[funcStrKey];
            var argsMatch = funcStr.match(funcBeginRegEx);
            var args = argsMatch.length ? argsMatch[1].split(/,\s*/) : [];
            if(args.length == 1 && args[0] == '') args = [];

            obj[funcStrKey] = Function.apply(this, _.flatten([args, unwrapFuncStr(funcStr)]));
        } catch(e) {
            throw "failed to parse url function key" + funcStrKey;
        }
    });

    return obj;
}

export function shortenUrl(url, callback) {
    // get a shortened url by calling the is.gd api
    Http.get(`http://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
        .end((err, res) => {
            if(err) callback(err, res);
            const obj = JSON.parse(res.text);
            if(_.has(obj, 'shorturl')) callback(err, obj.shorturl);
            else callback(new Error("no shorturl"), res);
        });
}

export function getWindowSize(useDPI = false) {
    // is2x for double resolution retina displays
    const dpiMult = (useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
    return {
        width: window.innerWidth * dpiMult,
        height: window.innerHeight * dpiMult
    };
}

export function isTouchDevice(){
    return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}