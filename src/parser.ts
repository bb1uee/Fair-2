import { Token, tokens } from "./lexer.js"

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
    val: (Assignment | Decleration)
}

enum DeclerationType {
    in,
    out,
    var
}

interface Decleration extends ASTNode {
    type: NodeType.Decleration
    varType: DeclerationType
    name: string
}

interface Assignment extends ASTNode {
    type: NodeType.Assignment
    rhs: Variable
    lhs: Expression
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

var toParse = tokens.slice()
var stack: Token[] = []

// #region utils

function accept (token: Token) {
    if (expect(token)) {
        let top = toParse.shift()
        
        if (top === undefined) throw `Syntax Error: undefined`

        stack.push(top)
    }
}

function expect (token: Token): boolean {
    if (toParse[0] === token) {
        return true
    }

    throw `Invalid Syntax: Expected ${token} instead of ${toParse[0]}`
}

// #endregion

function parse() {
    toParse.pop()

    
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
    ValueType
}