import { NODATA } from "dns"
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
    { symbol: "/", precedence: 20, type: ExpressionOperator.divide },
    { symbol: "^", precedence: 30, type: ExpressionOperator.power },
]

// #region utils

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
    
    throw `Invalid Syntax: Expected ${token} instead of ${tokens[0]}`
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
let ast: Program

let stack: (Token | ASTNode)[] = []

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
    if (line[0].tokenType !== TokenType.identifier) return false;
    stack = []

    let name = line[0].value

    // Parse the start of the assignment and popping those out so that they aren't uselessly in there
    accept(line, TokenType.identifier)
    stack.pop()
    accept(line, TokenType.operator)
    stack.pop()
    
    parseExpression(line, lineIndex, true)
    
    let assignment: Assignment = {
        type: NodeType.Assignment,
        lhs: {
            type: NodeType.Variable,
            name: name
        },
        rhs: stack[0] as Value
    }

    ast.code.push({
        type: NodeType.Statement,
        statementType: StatementType.Assignment,
        statement: assignment
    })

    return true
}

function parseExpression(line: Token[], lineIndex: number, newExpr: boolean) {
    // Creating a binary expression
    if (newExpr) acceptValue(line)
    accept(line, TokenType.operator)
    acceptValue(line)

    let precedence = 0
    let stackPrecedence = 0

    // find operator precedence
    if (line[0]) {
        operators.forEach(_ => {
            if (_.symbol === line[0].value) precedence = _.precedence
        })

        operators.forEach(_ => {
            if (_.symbol === (stack[stack.length - 2] as Token).value) stackPrecedence = _.precedence
        })
    }

    if (precedence > stackPrecedence) parseExpression(line, lineIndex, false)

    let rhs: Value

    if ("lhs" in stack[stack.length - 1]) {
        rhs = stack[stack.length - 1] as Value
    } else {
        rhs = tokenToValue(stack[stack.length - 1] as Token)
    }

    let operator: ExpressionOperator = ExpressionOperator.plus

    switch((stack[stack.length - 2] as Token).value) {
        case '+':
            operator = ExpressionOperator.plus
            break
        case '-':
            operator = ExpressionOperator.minus
            break
        case '*':
            operator = ExpressionOperator.times
            break
        case '/':
            operator = ExpressionOperator.divide
            break
    }

    let lhs: Value

    if ("lhs" in stack[stack.length - 3]) {
        lhs = {
            type: NodeType.Value,
            valueType: ValueType.Expression,
            value: stack[stack.length - 3] as Expression
        }
    } else {
        lhs = tokenToValue(stack[stack.length - 3] as Token)
    }

    // replace the binary expression with a value
    stack.pop()
    stack.pop()
    stack.pop()
    stack.push({
        type: NodeType.Value,
        valueType: ValueType.Expression,
        value: {
            type: NodeType.Expression,
            operator: operator,
            lhs: lhs,
            rhs: rhs
        }
    } as Value)

    if (line[0]) parseExpression(line, lineIndex, false)

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