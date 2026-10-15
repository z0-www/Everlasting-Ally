import type { DatabaseSync } from 'node:sqlite';
export declare const CURRENT_SCHEMA_VERSION = 2;
export declare function initializeSchema(db: DatabaseSync): void;
