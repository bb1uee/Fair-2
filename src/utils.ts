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

export {
    keywords,
    isAlpha,
    isNum,
    isKeyword
}