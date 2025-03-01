import { readCode } from "./code.js"
import { lexer, tokens } from "./lexer.js"

readCode("./code.txt")
lexer()
console.log(tokens)