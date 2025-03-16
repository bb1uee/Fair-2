import { Token, tokens, TokenType } from "./lexer.js"
import { splitArray } from "./utils.js"
import { isEqual } from "lodash-es"

// #region AST Types
enum NodeType {
    Program,
    Assignment,
    Variable,
    Expression,
    Number,
    Statement,
    Decleration,
    Value,
    ParameterList,
    FunctionCall
}

interface ASTNode {
    type: NodeType
}

interface Program extends ASTNode {
    type: NodeType.Program
    code: Statement[]
}

enum StatementType {
    Assignment,
    Decleration
}

interface Statement extends ASTNode {
    type: NodeType.Statement
    statementType: StatementType
    statement: (Assignment | Decleration)
}

enum DeclerationType {
    in,
    var,
    out
}

interface Decleration extends ASTNode {
    type: NodeType.Decleration
    varType: DeclerationType
    name: string
}

interface Assignment extends ASTNode {
    type: NodeType.Assignment
    lhs: Variable
    rhs: Value
}

interface Variable extends ASTNode {
    type: NodeType.Variable
    name: string
}

enum ExpressionOperator {
    times,
    divide,
    plus,
    minus,
    power
}

enum ValueType {
    Variable,
    Number,
    Expression,
    FunctionCall
}

interface Value extends ASTNode {
    type: NodeType.Value,
    valueType: ValueType,
    value: (Variable | Number | Expression | FunctionCall)
}

interface Expression extends ASTNode {
    type: NodeType.Expression
    operator: ExpressionOperator
    lhs: Value
    rhs: Value
}

interface Number extends ASTNode {
    type: NodeType.Number
    value: number
}

interface Operator {
    symbol: string
    precedence: number
    type: ExpressionOperator
}

interface ParameterList extends ASTNode {
    type: NodeType.ParameterList
    parameters: Value[]
}

interface FunctionCall extends ASTNode {
    type: NodeType.FunctionCall
    name: string
    parameters: ParameterList
}

interface Reduction {
    checker: (line: Token[]) => boolean
    reducer: (line: Token[]) => void
    name: string
}

// #endregion

const operators: Operator[] = [
    { symbol: "+", precedence: 10, type: ExpressionOperator.plus },
    { symbol: "-", precedence: 10, type: ExpressionOperator.minus },
    { symbol: "*", precedence: 20, type: ExpressionOperator.times },
    { symbol: "/", precedence: 20, type: ExpressionOperator.divide },
    { symbol: "^", precedence: 30, type: ExpressionOperator.power },
]

// #region Utils

function accept (tokens: Token[], token: TokenType) {
    if (expect(tokens, token)) {
        let top = tokens.shift()
        
        if (top === undefined) throw `Syntax Error: undefined`

        stack.push(top)
    }
}

function expect (tokens: Token[], token: TokenType): boolean {
    if (tokens[0].tokenType === token) {
        return true
    }

    throw `Invalid Syntax: Expected ${token} instead of ${tokens[0].tokenType} (expect call)`
}

function acceptToken (tokens: Token[], token: Token) {
    if (expectToken(tokens, token)) {
        let top = tokens.shift()
        
        if (top === undefined) throw `Syntax Error: undefined`

        stack.push(top)
    }
}

function expectToken (tokens: Token[], token: Token): boolean {
    if (isEqual(token, tokens[0])) {
        return true
    }

    throw `Invalid Syntax: Expected ${JSON.stringify(token, null, 4)} instead of ${JSON.stringify(tokens[0], null, 4)} (expect call)`
}

function tokenToValue (token: Token): Value {
    if (token.tokenType === TokenType.number) {
        return {
            type: NodeType.Value,
            valueType: ValueType.Number,
            value: {
                type: NodeType.Number,
                value: parseFloat(token.value)
            }
        }
    } else {
        return {
            type: NodeType.Value,
            valueType: ValueType.Variable,
            value: {
                type: NodeType.Variable,
                name: token.value
            }
        }
    }
}

function acceptValue(tokens: Token[]) {
    if (tokens[0].tokenType === TokenType.number) accept(tokens, TokenType.number)
        else accept(tokens, TokenType.identifier)
}

// #endregion

let lines: Token[][] = []
let ast: Program = {
    type: NodeType.Program,
    code: []
}

let stack: (Token | ASTNode)[] = []

// #region Main Parser

function parse() {
    lines = splitArray(tokens, (_) => {
        return _.tokenType === TokenType.EOL
    })

    lines.pop()
    
    lines.forEach((_, index) => {
        if (parseAssignment(lines[index], index + 1)) return
        else if (parseDecleration(lines[index], index + 1)) return
        throw `Invalid Syntax: line ${index + 1} does not contain a decleration or an assignment`
    })
}

function parseAssignment(line: Token[], lineNumber: number): boolean {
    stack = []
    if (line[0].tokenType !== TokenType.identifier) return false

    let name = line[0].value

    accept(line, TokenType.identifier)
    acceptToken(line, {
        tokenType: TokenType.operator,
        value: "="
    })

    let value = parseExpression(line, lineNumber)
    let assignment: Assignment = {
        type: NodeType.Assignment,
        lhs: {
            type: NodeType.Variable,
            name: name
        },
        rhs: value
    }

    ast.code.push({
        type: NodeType.Statement,
        statementType: StatementType.Assignment,
        statement: assignment
    })

    return true
}

function parseDecleration(line: Token[], lineNumber: number): boolean {
    stack = []
    if (line[0].tokenType !== TokenType.keyword) return false
    if (line[0].value !== "in" && line[0].value !== "out" && line[0].value !== "var") return false

    let type: DeclerationType = line[0].value === "in" ? DeclerationType.in : (line[0].value === "out" ? DeclerationType.out : DeclerationType.var)

    accept(line, TokenType.keyword)

    let decleration: Decleration = {
        type: NodeType.Decleration,
        varType: type,
        name: line[0].value
    }

    ast.code.push({
        type: NodeType.Statement,
        statementType: StatementType.Decleration,
        statement: decleration
    })

    return true
}

// #endregion

// #region Expression Parser
// #region Reductions

let reduceNumber: Reduction = {
    checker: (line) => {
        return "tokenType" in stack[0] && stack[0].tokenType === TokenType.number
    },
    reducer: (line) => {
        let token = stack.pop() as Token
        let num: Number = {
            type: NodeType.Number,
            value: parseFloat(token.value)
        }

        stack.push({
            type: NodeType.Value,
            valueType: ValueType.Number,
            value: num
        } as Value)
    },
    name: "Reduce Number"
}

let reduceVariable: Reduction = {
    checker: (line) => {
        return "tokenType" in stack[0] && stack[0].tokenType === TokenType.identifier && (line[0].tokenType === TokenType.operator || line[0].tokenType === TokenType.EOL)
    },
    reducer: (line) => {
        let token = stack.pop() as Token
        let variable: Variable = {
            type: NodeType.Variable,
            name: token.value
        }

        stack.push({
            type: NodeType.Value,
            valueType: ValueType.Variable,
            value: variable
        } as Value)
    },
    name: "Reduce Variable"
}

// #endregion

let reductions: Reduction[] = [
    reduceNumber,
    reduceVariable
]

function parseExpression(line: Token[], lineNumber: number): Value {
    stack = []
    line.push({
        tokenType: TokenType.EOL,
        value: "EOL"
    })

    while (line[0]) {
        stack.push(line.shift() as Token)
        attemptReductions(line)
    }

    if (!("valueType" in stack[0])) throw `Parsing Error: value is not at the top of the stack on line ${lineNumber}`

    return stack[0] as Value
}

function attemptReductions(line: Token[]) {
    reductions.forEach(_ => {
        if (_.checker(line)) {
            _.reducer(line)
            console.log(_.name)
        }
    })
}
// #endregion

export {
    Program,
    Assignment,
    Expression,
    Variable,
    Number,
    NodeType,
    ExpressionOperator,
    Statement,
    Decleration,
    DeclerationType,
    StatementType,
    Value,
    ValueType,
    ast,
    ASTNode,
    ParameterList,
    FunctionCall,
    parse
}