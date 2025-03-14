import { Token, tokens, TokenType } from "./lexer.js"
import { splitArray } from "./utils.js"

// #region AST Types
enum NodeType {
    Program,
    Assignment,
    Variable,
    Expression,
    Number,
    Statement,
    Decleration,
    Value
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
    rhs: Variable
    lhs: Value
}

interface Variable extends ASTNode {
    type: NodeType.Variable
    name: string
}

enum ExpressionOperator {
    times,
    divide,
    plus,
    minus
}

enum ValueType {
    Variable,
    Number,
    Expression
}

interface Value extends ASTNode {
    type: NodeType.Value,
    valueType: ValueType,
    value: (Variable | Number | Expression)
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

// #endregion

const operators: Operator[] = [
    { symbol: "+", precedence: 10, type: ExpressionOperator.plus },
    { symbol: "-", precedence: 10, type: ExpressionOperator.minus },
    { symbol: "*", precedence: 20, type: ExpressionOperator.times },
    { symbol: "/", precedence: 20, type: ExpressionOperator.divide }
]

var stack: Token[] = []

// #region utils

function accept (tokens: Token[], token: TokenType) {
    if (expect(token)) {
        let top = tokens.shift()
        
        if (top === undefined) throw `Syntax Error: undefined`

        stack.push(top)
    }
}

function expect (token: TokenType): boolean {
    if (tokens[0].tokenType === token) {
        return true
    }

    throw `Invalid Syntax: Expected ${token} instead of ${tokens[0]}`
}

// #endregion

let lines: Token[][] = []
let ast: Program

// accept and expect are only used for parsing assignments because declerations are simple enough to not need them 
function parse() {
    // Removing the EOF
    tokens.pop()

    ast = {
        type: NodeType.Program,
        code: []
    }

    lines = splitArray(tokens, (_) => {
        if (_.tokenType === TokenType.EOL) {
            return true
        }

        return false
    })

    let lineIndex = 0

    lines.forEach(line => {
        // new function for cleanliness
        parseLine(lines[lineIndex], lineIndex)
        lineIndex++
    });
}

function parseLine(line: Token[], lineIndex: number) {
    if (parseAssignment(line, lineIndex)) return;
    else if (parseDecleration(line, lineIndex)) return;

    throw `Error: line ${lineIndex + 1} is not a decleration or an assignment`
}

function parseAssignment(line: Token[], lineIndex: number): boolean {
    if (line[0].tokenType !== TokenType.variable) return false;

    

    return true
}

function parseDecleration(line: Token[], lineIndex: number): boolean {
    if (line[0].tokenType !== TokenType.keyword) return false;

    let declType = line[0].value === "in" ? DeclerationType.in : (line[0].value === "out" ? DeclerationType.out : DeclerationType.var)
    let name = line[1].value

    let decleration: Decleration = {
        type: NodeType.Decleration,
        varType: declType,
        name: name
    }

    let statement: Statement = {
        type: NodeType.Statement,
        statementType: StatementType.Decleration,
        statement: decleration
    }

    ast.code.push(statement)

    return true;
}

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
    StatementType,
    Value,
    ValueType,
    parse,
    ast
}