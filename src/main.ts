import { readCode } from "./code.js"
import { lexer } from "./lexer.js"
import { ast, parse } from "./parser.js"

readCode("./code.txt")
lexer()
parse()

console.log(JSON.stringify(ast, undefined, 4))