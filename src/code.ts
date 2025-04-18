import { readFileSync } from "fs"

var programCode: string = "awdaw awdaw "

function readCode(path: string) {
    try{
        programCode = readFileSync(path, { encoding: 'utf-8', flag: 'r' })
    } catch (err) {
    programCode = ""
    }
    programCode = programCode.concat("$")
    programCode = programCode.replace("\n", " ")
}

function consumeCharacter(): string {
    let ret = programCode.slice(0, 1)
    programCode = programCode.slice(1, programCode.length)

    return ret
}

function peekCharacter(): string {
    return programCode.slice(0, 1)
}

export {
    programCode,
    readCode,
    consumeCharacter,
    peekCharacter
}
