import {getPostgresPool} from "@/lib/infrastructure/postgres-runtime";import {createAuthenticationAdapter} from "./composition";import type {AuthenticationAdapter} from "./authentication";
export function getRuntimeAuthenticationAdapter():AuthenticationAdapter{try{return createAuthenticationAdapter({pool:getPostgresPool()})}catch{return createAuthenticationAdapter()}}
