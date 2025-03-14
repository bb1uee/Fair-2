const keywords: string[] = [
    "in",
    "out",
    "var"
]

function isAlpha(char: string) {
    return /[A-Za-z]/.test(char)
}

function isNum(char: string) {
    return /[1-9]/.test(char)
}

function isKeyword(target: string) {
    return keywords.includes(target)
}

function splitArray<T>(data:T[], shouldSplit: (element: T) => boolean): T[][] {
    let ret: T[][] = [[]]

    let start = 0;
    for (let i = 0; i < data.length; i++) {
        if (shouldSplit(data[i])) {
            ret.push(data.slice(start, i))
            start = i + 1
        }
    }

    ret.push(data.slice(start, data.length))
    ret.shift()

    return ret
}

export {
    keywords,
    isAlpha,
    isNum,
    isKeyword,
    splitArray
}