import {describe,expect,it} from "vitest";import {getPostgresPool,PostgresRuntimeConfigurationError} from "../postgres-runtime";
describe("PostgreSQL runtime",()=>{it("fails closed without DATABASE_URL",()=>{expect(()=>getPostgresPool({})).toThrow(PostgresRuntimeConfigurationError)})});
