import { ASTNode, DeclerationType, NodeType, Program, Statement, StatementType } from "./parser.js"

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

//#endregion

let variables: RuntimeVariable[] = []
let nodeExecutions: Map<NodeType, (node: ASTNode) => number> = new Map([
    [NodeType.Program, program],
    [NodeType.Statement, statement]
])

function execute() {

}

export {
    execute
}