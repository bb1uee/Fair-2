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

function getOperatorPrecedence(type: string): number {
    let ret: number | undefined = undefined
    operators.forEach(_ => {
        if (_.symbol === type) {
            ret = _.precedence
        }
    })

    if (ret === undefined) throw `Syntax Error: operator ${type} does not exist (precedence)`
    return ret
}

function getOperator(type: string): ExpressionOperator {
    let ret: ExpressionOperator | undefined = undefined
    operators.forEach(_ => {
        if (_.symbol === type) {
            ret = _.type
        }
    })

    if (ret === undefined) throw `Syntax Error: operator ${type} does not exist`
    return ret
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
        let stack1 = stack[stack.length - 1]
        if (!("tokenType" in stack1)) return false
        return stack1.tokenType === TokenType.number
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
        let stack1 = stack[stack.length - 1]
        if (!("tokenType" in stack1)) return false
        return stack1.tokenType === TokenType.identifier && line[0].value !== "("
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

let reduceBinaryExpr: Reduction = {
    checker: (line) => {
        let goodStack = false
        let stack2 = stack[stack.length - 2]
        if (stack.length < 3) return false
        if (!("tokenType" in stack2)) return false
        goodStack = "valueType" in stack[stack.length - 3] && "valueType" in stack[stack.length - 1] && stack2.tokenType === TokenType.operator
        if (!goodStack) return false

        let lookEnd = line[0].tokenType === TokenType.EOL || line[0].tokenType === TokenType.seperator
        let goodOperator = false

        if (line[0].tokenType === TokenType.operator) {
            goodOperator = getOperatorPrecedence(line[0].value) <= getOperatorPrecedence(stack2.value)
        }

        return lookEnd || goodOperator
    },
    reducer: (line) => {
        let rhs = stack.pop() as Value
        let operator = stack.pop() as Token
        let lhs = stack.pop() as Value
        let expression: Expression = {
            type: NodeType.Expression,
            operator: getOperator(operator.value),
            lhs: lhs,
            rhs: rhs
        }

        stack.push({
            type: NodeType.Value,
            valueType: ValueType.Expression,
            value: expression
        } as Value)
    },
    name: "Reduce Binary Expression"
}

let reduceParenthesis: Reduction = {
    checker: (line) => {
        if (stack.length < 4) return false

        let right = stack[stack.length - 1]
        let value = stack[stack.length - 2]
        let left = stack[stack.length - 3]
        let operator = stack[stack.length - 4]

        let goodRight = "tokenType" in right && right.value === ")"
        let goodValue = "valueType" in value
        let goodLeft = "tokenType" in left && left.value === "("
        let goodOperator = "tokenType" in operator && operator.tokenType !== TokenType.identifier

        return goodRight && goodValue && goodLeft && goodOperator
    },
    reducer: (line) => {
        stack.pop()
        let value = stack.pop() as Value
        stack.pop()

        stack.push(value)
    },
    name: "Reduce Parenthesis"
}

let reduceSingleParameter: Reduction = {
    checker: (line) => {
        if (stack.length < 3) return false
        if (!line[0]) return false

        let seperator = line[0]
        let value = stack[stack.length - 1]
        let paren = stack[stack.length - 2]
        let identifier = stack[stack.length - 3]
        
        let goodSeperator = "tokenType" in seperator && (seperator.value === ")" || seperator.value === ",")
        let goodValue = "valueType" in value
        let goodParen = "tokenType" in paren && paren.value === "("
        let goodIdentifier = "tokenType" in identifier && identifier.tokenType === TokenType.identifier

        return goodValue && goodParen && goodIdentifier && goodSeperator
    },
    reducer: (line) => {
        let value = stack.pop() as Value

        stack.push({
            type: NodeType.ParameterList,
            parameters: [value]
        } as ParameterList)
    },
    name: "Reduce Single Parameter"
}

let reduceFunctionCall: Reduction = {
    checker: (line) => {
        if (stack.length < 4) return false

        let closeParen = stack[stack.length - 1]
        let paramList = stack[stack.length - 2]
        let openParam = stack[stack.length - 3]
        let identifier = stack[stack.length - 4]

        let goodCloseParen = "tokenType" in closeParen && closeParen.value === ")"
        let goodParamList = "parameters" in paramList
        let goodOpenParen = "tokenType" in openParam && openParam.value === "("
        let goodIdentifier = "tokenType" in identifier && identifier.tokenType === TokenType.identifier

        return goodCloseParen && goodParamList && goodOpenParen && goodIdentifier
    },
    reducer: (line) => {
        stack.pop()
        let paramList = stack.pop() as ParameterList
        stack.pop()
        let name = (stack.pop() as Token).value

        let functionCall = {
            type: NodeType.FunctionCall,
            name: name,
            parameters: paramList
        } as FunctionCall

        stack.push({
            type: NodeType.Value,
            valueType: ValueType.FunctionCall,
            value: functionCall
        } as Value)
    },
    name: "Reduce Function Call"
}

let reduceParameterLessFunctionCall: Reduction = {
    checker: (line) => {
        if (stack.length < 3) return false

        let close = stack[stack.length - 1]
        let open = stack[stack.length - 2]
        let identifier = stack[stack.length - 3]

        let goodClose = "tokenType" in close && close.value === ")"
        let goodOpen = "tokenType" in open && open.value === '('
        let goodIdentifier = "tokenType" in identifier && identifier.tokenType === TokenType.identifier

        return goodClose && goodOpen && goodIdentifier
    },
    reducer: (line) => {
        stack.pop()
        stack.pop()
        let identifier = stack.pop() as Token

        let call = {
            type: NodeType.FunctionCall,
            name: identifier.value,
            parameters: {
                type: NodeType.ParameterList,
                parameters: []
            }
        } as FunctionCall

        stack.push({
            type: NodeType.Value,
            valueType: ValueType.FunctionCall,
            value: call
        } as Value)
    },
    name: "Reduce Parameterless Function Call"
}

let reduceParameterList: Reduction = {
    checker: (line) => {
        if (stack.length < 3) return false

        let value = stack[stack.length - 1]
        let comma = stack[stack.length - 2]
        let params = stack[stack.length - 3]

        let goodValue = "valueType" in value
        let goodComma = "tokenType" in comma && comma.value === ","
        let goodParams = "parameters" in params

        return goodValue && goodComma && goodParams
    },
    reducer: (line) => {
        let value = stack.pop() as Value
        stack.pop()
        let params = stack.pop() as ParameterList
        params.parameters.push(value)

        stack.push(params)
    },
    name: "Reduce Parameter List"
}

// #endregion

let reductions: Reduction[] = [
    reduceNumber,
    reduceVariable,
    reduceBinaryExpr,
    reduceParenthesis,
    reduceSingleParameter,
    reduceFunctionCall,
    reduceParameterList,
    reduceParameterLessFunctionCall
]

function parseExpression(line: Token[], lineNumber: number): Value {
    stack = []
    line.push({
        tokenType: TokenType.EOL,
        value: "EOL"
    })

    while (line[0]) {
        stack.push(line.shift() as Token)
        console.log("Shift")
        attemptReductions(line)
    }

    if (!("valueType" in stack[0])) throw `Parsing Error: value is not at the top of the stack on line ${lineNumber}`
    console.log(JSON.stringify(stack[0], null, 4))
    return stack[0] as Value
}

function attemptReductions(line: Token[]) {
    reductions.forEach(_ => {
        if (_.checker(line)) {
            _.reducer(line)
            console.log(_.name)
            attemptReductions(line)
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