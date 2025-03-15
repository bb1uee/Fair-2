import { consumeCharacter, peekCharacter } from "./code.js"
import { isAlpha, isKeyword, isNum } from "./utils.js"

enum TokenType {
    operator,
    number,
    identifier,
    keyword,
    seperator,
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
                tokens.push({ tokenType: TokenType.operator, value: '=' })
                consumeCharacter()
                continue
            case '+':
                tokens.push({ tokenType: TokenType.operator, value: '+' })
                consumeCharacter()
                continue
            case '-':
                tokens.push({ tokenType: TokenType.operator, value: '-' })
                consumeCharacter()
                continue
            case '*':
                tokens.push({ tokenType: TokenType.operator, value: '*' })
                consumeCharacter()
                continue
            case '/':
                tokens.push({ tokenType: TokenType.operator, value: '/' })
                consumeCharacter()
                continue
            case '^':
                tokens.push({ tokenType: TokenType.operator, value: '^' })
                consumeCharacter()
                continue
            case ";":
                tokens.push({ tokenType: TokenType.EOL, value: "EOL" })
                consumeCharacter()
                continue
            case '(':
                tokens.push({ tokenType: TokenType.seperator, value: '(' })
                consumeCharacter()
                continue
            case ')':
                tokens.push({ tokenType: TokenType.seperator, value: ')' })
                consumeCharacter()
                continue
            case ',':
                tokens.push({ tokenType: TokenType.seperator, value: ',' })
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

            if (tokens[tokens.length - 1].tokenType === TokenType.number) {
                tokens.push({ tokenType: TokenType.operator, value: '*' })
            }

            tokens.push({ tokenType: TokenType.identifier, value: val })
            continue
        }
    }

}

export {
    lexer,
    readNumber,
    readWord,
    tokens,
    TokenType,
    Token
}