
export function endsWithChar(word: any, c: any) {
    if (c.length > 1) {
        return c.indexOf(word.slice(-1)) > -1;
    }

    return word.slice(-1) === c;
};

export function endsWith(word: any, end: any) {
    return word.slice(word.length - end.length) === end;
};
