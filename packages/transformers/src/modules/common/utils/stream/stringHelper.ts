
exports.endsWithChar = function ends_with_char(word: any, c: any) {
    if (c.length > 1) {
        return c.indexOf(word.slice(-1)) > -1;
    }

    return word.slice(-1) === c;
};

exports.endsWith = function ends_with(word: any, end: any) {
    return word.slice(word.length - end.length) === end;
};