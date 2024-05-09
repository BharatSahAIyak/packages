export var abbreviations: any;

export var englishAbbreviations = [
    "al",
    "adj",
    "assn",
    "Ave",
    "BSc", "MSc",
    "Cell",
    "Ch",
    "Co",
    "cc",
    "Corp",
    "Dem",
    "Dept",
    "ed",
    "eg",
    "Eq",
    "Eqs",
    "est",
    "est",
    "etc",
    "Ex",
    "ext", // + number?
    "Fig",
    "fig",
    "Figs",
    "figs",
    "i.e",
    "ie",
    "Inc",
    "inc",
    "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Sept", "Oct", "Nov", "Dec",
    "jr",
    "mi",
    "Miss", "Mrs", "Mr", "Ms",
    "Mol",
    "mt",
    "mts",
    "no",
    "Nos",
    "PhD", "MD", "BA", "MA", "MM",
    "pl",
    "pop",
    "pp",
    "Prof", "Dr",
    "pt",
    "Ref",
    "Refs",
    "Rep",
    "repr",
    "rev",
    "Sec",
    "Secs",
    "Sgt", "Col", "Gen", "Rep", "Sen", 'Gov', "Lt", "Maj", "Capt", "St",
    "Sr", "sr", "Jr", "jr", "Rev",
    "Sun", "Mon", "Tu", "Tue", "Tues", "Wed", "Th", "Thu", "Thur", "Thurs", "Fri", "Sat",
    "trans",
    "Univ",
    "Viz",
    "Vol",
    "vs",
    "v",
];

export function setAbbreviations(abbr: any) {
    if (abbr) {
        abbreviations = abbr;
    } else {
        abbreviations = englishAbbreviations;
    }
}

export function isCapitalized(str: any) {
    return /^[A-Z][a-z].*/.test(str) || isNumber(str);
}

// Start with opening quotes or capitalized letter
export function isSentenceStarter(str: any) {
    return isCapitalized(str) || /``|"|'/.test(str.substring(0, 2));
}

export function isCommonAbbreviation(str: any) {
    var noSymbols = str.replace(/[-'`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, "");

    return ~abbreviations.indexOf(noSymbols);
}

// This is going towards too much rule based
export function isTimeAbbreviation(word: any, next: any) {
    if (word === "a.m." || word === "p.m.") {
        var tmp = next.replace(/\W+/g, '').slice(-3).toLowerCase();

        if (tmp === "day") {
            return true;
        }
    }

    return false;
}

export function isDottedAbbreviation(word: any) {
    var matches = word.replace(/[\(\)\[\]\{\}]/g, '').match(/(.\.)*/);
    return matches && matches[0].length > 0;
}

// TODO look for next words, if multiple are capitalized,
// then it's probably not a sentence ending
export function isCustomAbbreviation(str: any) {
    if (str.length <= 3) {
        return true;
    }

    return isCapitalized(str);
}

// Uses current word count in sentence and next few words to check if it is
// more likely an abbreviation + name or new sentence.
export function isNameAbbreviation(wordCount: any, words: any) {
    if (words.length > 0) {
        if (wordCount < 5 && words[0].length < 6 && isCapitalized(words[0])) {
            return true;
        }

        var capitalized = words.filter(function (str: any) {
            return /[A-Z]/.test(str.charAt(0));
        });

        return capitalized.length >= 3;
    }

    return false;
}

export function isNumber(str: any, dotPos=null) {
    if (dotPos) {
        str = str.slice(dotPos - 1, dotPos + 2);
    }

    return !isNaN(str);
};

// Phone number matching
// http://stackoverflow.com/a/123666/951517
export function isPhoneNr(str: any) {
    return str.match(/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/);
};

// Match urls / emails
// http://stackoverflow.com/a/3809435/951517
export function isURL(str: any) {
    return str.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
};

// Starting a new sentence if beginning with capital letter
// Exception: The word is enclosed in brackets
export function isConcatenated(word: any) {
    var i = 0;

    if ((i = word.indexOf(".")) > -1 ||
        (i = word.indexOf("!")) > -1 ||
        (i = word.indexOf("?")) > -1) {
        var c = word.charAt(i + 1);

        // Check if the next word starts with a letter
        if (c.match(/[a-zA-Z].*/)) {
            return [word.slice(0, i), word.slice(i + 1)];
        }
    }

    return false;
};

export function isBoundaryChar(word: any) {
    return word === "." ||
        word === "!" ||
        word === "?";
};
