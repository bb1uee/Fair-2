import { readFile, readFileSync } from "fs"
import { readCode } from "./code.js"
import { execute } from "./execution.js"
import { lexer, tokens } from "./lexer.js"
import { ast, parse } from "./parser.js"

try {
    readCode("./code.txt")
    lexer()
    console.log("throw")
    parse()

    execute(ast, new Map<string, number>([
        ["a", 3.1],
        ["b", 4.9],
        ["C", 123]
    ]))

    // console.log(JSON.stringify(ast, null, 4))
} catch (e) {
    console.log(e)
}