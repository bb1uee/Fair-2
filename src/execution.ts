import exp from "constants"
import { ASTNode, Decleration, DeclerationType, NodeType, Program, Statement, StatementType, Variable, Number, Value, ValueType, Expression, ExpressionOperator, Assignment, FunctionCall } from "./parser.js"
import { createInterface } from 'readline'
import { readFileSync } from "fs"
import { NOTIMP } from "dns"

// #region data

interface RuntimeVariable {
    name: string,
    value: number,
    // Makes it easier to like set things equal without switches and cool
    type: DeclerationType
}

// #endregion

//#region executions

function program (node: ASTNode): number {
    let program = node as Program

    program.code.forEach(_ => {
        let run = nodeExecutions.get(NodeType.Statement) as (node: ASTNode) => number
        run(_)
    })

    return 0
}

function statement (node: ASTNode): number {
    let statement = node as Statement

    if (statement.statementType === StatementType.Decleration) {
        let run = nodeExecutions.get(NodeType.Decleration) as (node: ASTNode) => number
        run(statement.statement)
    } else {
        let run = nodeExecutions.get(NodeType.Assignment) as (node: ASTNode) => number
        run(statement.statement)
    }

    return 0
}

function decleration(node: ASTNode): number {
    let decleration = node as Decleration
    
    let value = 0

    if (decleration.varType === DeclerationType.in) {
        let temp = input.get(decleration.name)

        if (!temp) throw `Error: input variable ${decleration.name} is not provided`

        value = temp
    }
    
    variables.set(decleration.name, {
        name: decleration.name,
        type: decleration.varType,
        value: value
    })

    return 0
}

function variable(node: ASTNode): number {
    let variable = node as Variable

    if (variables.get(variable.name) === undefined) {
        throw `Variable ${variable.name} does not exist`
    }

    // @ts-ignore
    return variables.get(variable.name).value
}

function number(node: ASTNode): number {
    let number = node as Number

    return number.value
}

function value(node: ASTNode): number {
    let value = node as Value
    
    if (value.valueType === ValueType.Number) {
        let run = nodeExecutions.get(NodeType.Number) as (node: ASTNode) => number
        return run(value.value as Number)
    } else if (value.valueType === ValueType.Variable) {
        let run = nodeExecutions.get(NodeType.Variable) as (node: ASTNode) => number
        return run(value.value as Variable)
    } else {
        let run = nodeExecutions.get(NodeType.Expression) as (node: ASTNode) => number
        return run(value.value as Expression)
    }
}

function expression(node: ASTNode): number {
    let expression = node as Expression
    let run = nodeExecutions.get(NodeType.Value) as (node: ASTNode) => number
    if (!expression.lhs) {
        console.log(JSON.stringify(expression, null, 4))
    }
    let lhs = run(expression.lhs)
    let rhs = run(expression.rhs)
    let value = 0

    switch (expression.operator) {
        case ExpressionOperator.plus:
            value = lhs + rhs
            break
        case ExpressionOperator.minus:
            value = lhs - rhs
            break
        case ExpressionOperator.times:
            value = lhs * rhs
            break
        case ExpressionOperator.divide:
            value = lhs / rhs
            break
        case ExpressionOperator.power:
            value = Math.pow(lhs, rhs)
            break
    }

    return value
}

function assignment(node: ASTNode): number {
    let assignment = node as Assignment

    let run = nodeExecutions.get(NodeType.Value) as (node: ASTNode) => number
    
    let value = run(assignment.rhs)

    let variable = variables.get(assignment.lhs.name)
    if (variable === undefined) throw `Variable ${assignment.lhs.name} does not exist`
    
    variables.set(assignment.lhs.name, {
        name: assignment.lhs.name,
        value: value,
        type: variable.type
    })

    return 0
}

function functioncall(node: ASTNode): number {
    let functioncall = node as FunctionCall
}

//#endregion

let variables: Map<string, RuntimeVariable> = new Map()
let functions: Map<string, (params: number[]) => number> = new Map([
    
])
let nodeExecutions: Map<NodeType, (node: ASTNode) => number> = new Map([
    [NodeType.Program, program],
    [NodeType.Statement, statement],
    [NodeType.Decleration, decleration],
    [NodeType.Variable, variable],
    [NodeType.Number, number],
    [NodeType.Value, value],
    [NodeType.Expression, expression],
    [NodeType.Assignment, assignment],
    [NodeType.FunctionCall, functioncall]
])

let input: Map<string, number> = new Map

function execute(program: Program, pinput: Map<string, number>) {

    input = pinput
    let run = nodeExecutions.get(NodeType.Program) as (node: ASTNode) => number
    run(program)

    variables.forEach(_ => {
        if (_.type === DeclerationType.out) {
            console.log(_.value)
        }
    })
}

export {
    execute
}