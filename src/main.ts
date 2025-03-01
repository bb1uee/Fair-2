import { read, readFileSync } from "fs"

// ----------------------------------------------------- Code ---------------------------------------------------------------

var programCode: string = "awdaw awdaw "

function readCode(path: string) {
    programCode = readFileSync(path, { encoding: 'utf-8', flag: 'r' })
    programCode = programCode.concat("$")
    programCode = programCode.replace("\n", " ")
}

function consumeCharacter(): string {
    let ret = programCode.slice(0, 1)
    programCode = programCode.slice(1, programCode.length)

    return ret
}

function peekCharacter(): string {
    return programCode.slice(0, 1)
}

// ----------------------------------------------------- Utils ---------------------------------------------------------------

function isAlpha(char: string) {
    return /[A-Za-z]/.test(char)
}

function isNum(char: string) {
    return /[1-9]/.test(char)
}

function isKeyword(target: string) {
    return keywords.includes(target)
}

// ----------------------------------------------------- Lexer ---------------------------------------------------------------

const keywords: string[] = [
    "in",
    "out",
    "var"
]

enum TokenType {
    equals,
    plus,
    minus,
    times,
    divide,
    number,
    variable,
    keyword,
    EOL,
    EOF
}

interface Token {
    tokenType: TokenType,
    value: string
}

var tokens: Token[] = []

function readNumber(value: string): number {
    let nextChar = peekCharacter()

    if (isNum(nextChar) || nextChar === ".") {
        value = value.concat(consumeCharacter())
        return readNumber(value)
    } else {
        return parseFloat(value)
    }
}

function readWord(value: string): string {
    let nextChar = peekCharacter()
    
    if (isAlpha(nextChar)) {
        value = value.concat(consumeCharacter())
        return readWord(value)
    } else {
        return value
    }
}

function lexer() {
    while (peekCharacter() !== "") {
        let nextChar = peekCharacter()
        
        if (nextChar === " " || nextChar === "\n" || nextChar === "\t" || nextChar === "\r") {
            consumeCharacter()
            continue
        } else if (nextChar === "$") {
            tokens.push({ tokenType: TokenType.EOF, value: "EOF" })
            break
        }

        switch (nextChar) {
            case '=':
                tokens.push({ tokenType: TokenType.equals, value: '=' })
                consumeCharacter()
                continue
            case '+':
                tokens.push({ tokenType: TokenType.plus, value: '+' })
                consumeCharacter()
                continue
            case '-':
                tokens.push({ tokenType: TokenType.minus, value: '-' })
                consumeCharacter()
                continue
            case '*':
                tokens.push({ tokenType: TokenType.times, value: '*' })
                consumeCharacter()
                continue
            case '/':
                tokens.push({ tokenType: TokenType.divide, value: '/' })
                consumeCharacter()
                continue
            case ";":
                tokens.push({ tokenType: TokenType.EOL, value: "EOL" })
                consumeCharacter()
                continue
        }

        if (isNum(nextChar)) {
            let val = readNumber("")
            tokens.push({ tokenType: TokenType.number, value: val.toString() })
            continue
        } else if (isAlpha(nextChar)) {
            let val = readWord("")

            if (isKeyword(val)) {
                tokens.push({ tokenType: TokenType.keyword, value: val })
                continue
            }

            tokens.push({ tokenType: TokenType.variable, value: val })
            continue
        }
    }

}

// ----------------------------------------------------- Execute -------------------------------------------------------

readCode("./code.txt")
lexer()
console.log(tokens)