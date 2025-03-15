import { readFile, readFileSync } from "fs"
import { readCode } from "./code.js"
import { execute } from "./execution.js"
import { lexer, tokens } from "./lexer.js"
import { ast, parse } from "./parser.js"

try {
    readCode("./code.txt")
    lexer()
    parse()

    execute(ast, new Map<string, number>([
        ["a", 2],
        ["b", 3]
    ]))
} catch (e) {
    console.log(e)
}