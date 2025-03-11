// #region AST Types
enum NodeType {
    Program,
    Assignment,
    Variable,
    Expression,
    Number,
    Statement,
    Decleration
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

/**
 * NN - LHS and RHS are both numbers
 * 
 * VN - LHS is a variable and RHS is a number
 * 
 * NV - LHS is a number and RHS is a variable
 * 
 * VV - LHS and RHS are both variables
 */
enum ExpressionType {
    NN,
    VN,
    NV,
    VV
}

interface Expression extends ASTNode {
    type: NodeType.Expression
    operator: ExpressionOperator
    expressionType: ExpressionType
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

// #endregion

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
    ExpressionOperator,
    Statement,
    Decleration,
    StatementType
}