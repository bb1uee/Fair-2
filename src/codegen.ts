// #region codegen functions
function program(node: ASTNode): string {
    let program = node as Program
    
    let run = codeGenerators.get(NodeType.Statement) as (node: ASTNode) => string
    let children: string[] = []

    program.code.forEach(_ => {
        children.push(`${run(_)}\n`)
    })

    let code = `
    function run(_funcs: Map<string, (params: number[]) => number>, input: Map<string, number>): Map<string, number> {
        let variables: Map<string, {
            value: number,
            type: ("in" | "out" | "var")
        }> = new Map();

        ${children.join("")}
        input.forEach((value, key) => {
            variables.set(key, {
                value: value,
                type: "in"
            })
        });

        let ret: Map<string, number> = new Map();

        variables.forEach((value, key) => {
            if (value.type === "out") {
                ret.set(key, value.value);
            }
        });

        return ret;
    }
    `

    return code
}

function statement(node: ASTNode): string {
    let statement = node as Statement
    let code = ""

    if (statement.statementType === StatementType.Decleration) {
        let run = codeGenerators.get(NodeType.Decleration) as (node: ASTNode) => string
        code = run(statement.statement as Decleration)
    } else {
        let run = codeGenerators.get(NodeType.Assignment) as (node: ASTNode) => string
        code = run(statement.statement as Assignment)
    }

    return code + ";"
}

function decleration(node: ASTNode): string {
    let decleration = node as Decleration
    let declType = decleration.varType === DeclerationType.in ? "in" : decleration.varType === DeclerationType.out ? "out" : "var"
    let code = `variables.set("${decleration.name}", {
        value: 0,
        type: "${declType}"
    })`

    return code
}

function assignment(node: ASTNode): string {
    let assignment = node as Assignment
    let run = codeGenerators.get(NodeType.Value) as (node: ASTNode) => string
    let rhs = run(assignment.rhs)
    let get = `(variables.get("${assignment.lhs.name}") as { value: number, type: ("in" | "out" | "var") })`

    let code = `variables.set("${assignment.lhs.name}", {
        value: ${rhs},
        type: ${get}.type
    })`

    return code
}

function value(node: ASTNode): string {
    let value = node as Value
    let run: (node: ASTNode) => string

    switch (value.valueType) {
        case ValueType.Number:
            run = codeGenerators.get(NodeType.Number) as (node: ASTNode) => string
            return run(value.value)
            break
        case ValueType.Number:
            run = codeGenerators.get(NodeType.Number) as (node: ASTNode) => string
            return run(value.value)
            break
        case ValueType.Number:
            run = codeGenerators.get(NodeType.Number) as (node: ASTNode) => string
            return run(value.value)
            break
        case ValueType.Number:
            run = codeGenerators.get(NodeType.Number) as (node: ASTNode) => string
            return run(value.value)
            break
    }

    throw `AST Error: Value ${JSON.stringify(value, null, 4)} does not contain a value`
}

function number(node: ASTNode): string {
    let number = node as Number

    return `${number.value}`
}
// #endregion

import { Assignment, ASTNode, Decleration, DeclerationType, NodeType, Program, Statement, StatementType, Value, ValueType, Variable, Number } from "./parser.js"

const codeGenerators: Map<NodeType, (node: ASTNode) => string> = new Map([
    [NodeType.Program, program],
    [NodeType.Statement, statement],
    [NodeType.Decleration, decleration],
    [NodeType.Assignment, assignment],
    [NodeType.Value, value],
    [NodeType.Number, number]
])

function codegen(program: Program): string {
    let run = codeGenerators.get(NodeType.Program) as (node: ASTNode) => string
    return run(program)
}

export {
    codegen
}