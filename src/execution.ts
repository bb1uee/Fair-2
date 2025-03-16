import exp from "constants"
import { ASTNode, Decleration, DeclerationType, NodeType, Program, Statement, StatementType, Variable, Number, Value, ValueType, Expression, ExpressionOperator, Assignment, FunctionCall } from "./parser.js"
import { createInterface } from 'readline'
import { readFileSync } from "fs"
import { NOTIMP } from "dns"
import { parseArgs } from "util"

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
    } else if (value.valueType === ValueType.FunctionCall) {
        let run = nodeExecutions.get(NodeType.FunctionCall) as (node: ASTNode) => number
        return run(value.value as FunctionCall)
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

    let run = nodeExecutions.get(NodeType.Value) as (node: ASTNode) => number
    let params: number[] = []

    functioncall.parameters.parameters.forEach(_ => {
        params.push(run (_))
    })

    let func = functions.get(functioncall.name)

    if (!func) throw `Syntax Error: function ${functioncall.name} does not exist`

    return func(params)
}

//#endregion

let variables: Map<string, RuntimeVariable> = new Map()
let functions: Map<string, (params: number[]) => number> = new Map([
    ["sin", (params: number[]) => {
        return Math.sin(params[0])
    }],
    ["sqrt", (params: number[]) => {
        return Math.sqrt(params[0])
    }],
    ["root", (params: number[]) => {
        // Take the second number to the root specified by the first one
        return Math.pow(params[1], 1 / params[0])
    }],
    ["log", (params: number[]) => {
        // The base 10 logarthim
        return Math.log10(params[0])
    }],
    ["cos", (params: number[]) => {
        return Math.cos(params[0])
    }],
    ["tan", (params: number[]) => {
        return Math.tan(params[0])
    }],
    ["arcsin", (params: number[]) => {
        return Math.asin(params[0])
    }],
    ["arccos", (params: number[]) => {
        return Math.acos(params[0])
    }],
    ["arctan", (params: number[]) => {
        return Math.atan(params[0])
    }],
    ["csc", (params: number[]) => {
        return 1 / Math.sin(params[0])
    }],
    ["sec", (params: number[]) => {
        return 1 / Math.cos(params[0])
    }],
    ["cot", (params: number[]) => {
        return 1 / Math.tan(params[0])
    }],
    ["rd", (params: number[]) => {
        // radians to degrees
        return params[0] * 360 / (2*Math.PI)
    }],
    ["dr", (params: number[]) => {
        // degrees to radians
        return params[0] * 2 * Math.PI / 360
    }],
    ["pi", (params: number[]) => {
        return Math.PI
    }],
    ["e", (params: number[]) => {
        return Math.E
    }],
    ["ln", (params: number[]) => {
        return Math.log(params[0]) / Math.log(Math.E)
    }]
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