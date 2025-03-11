enum NodeType {
    Program,
    Assignment,
    Variable,
    Expression,
    Number,
}

interface ASTNode {
    type: NodeType
}

interface Program extends ASTNode {
    type: NodeType.Program
    code: Assignment[]
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

interface Expression extends ASTNode {
    type: NodeType.Expression
    operator: ExpressionOperator
    lhs: (Variable | Number)
    rhs: (Variable | Number)
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

const operators: Operator[] = [
    { symbol: "+", precedence: 10, type: ExpressionOperator.plus },
    { symbol: "-", precedence: 10, type: ExpressionOperator.minus },
    { symbol: "*", precedence: 20, type: ExpressionOperator.times },
    { symbol: "/", precedence: 20, type: ExpressionOperator.divide }
]

export {
    Program,
    Assignment,
    Expression,
    Variable,
    Number,
    NodeType,
    ExpressionOperator
}