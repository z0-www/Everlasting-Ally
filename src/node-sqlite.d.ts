declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(filename: string)
    exec(sql: string): void
    prepare(sql: string): StatementSync
    close(): void
  }
  export interface StatementSync {
    run(...parameters: unknown[]): { changes: number; lastInsertRowid: number | bigint }
    get(...parameters: unknown[]): Record<string, unknown> | undefined
    all(...parameters: unknown[]): Array<Record<string, unknown>>
  }
}
declare module 'node:fs' {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void
}
declare module 'node:os' {
  export function homedir(): string
  export function tmpdir(): string
}
declare module 'node:path' {
  export function join(...paths: string[]): string
  export function dirname(path: string): string
}
