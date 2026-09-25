import type {InfrastructureAdapters} from "./types";import {UnconfiguredAuthAdapter,UnconfiguredDatabaseAdapter,UnconfiguredStorageAdapter} from "./adapters/unconfigured";
let singleton:InfrastructureAdapters|undefined;
export function infrastructure():InfrastructureAdapters{if(!singleton)singleton={database:new UnconfiguredDatabaseAdapter(),auth:new UnconfiguredAuthAdapter(),storage:new UnconfiguredStorageAdapter()};return singleton}
export async function infrastructureHealth(){const i=infrastructure();return Promise.all([i.database.health(),i.auth.health(),i.storage.health()])}
