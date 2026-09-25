const serverKeys=["DATABASE_URL","AUTH_ISSUER_URL","AUTH_AUDIENCE","OBJECT_STORAGE_ENDPOINT","OBJECT_STORAGE_BUCKET"] as const;
export type ServerEnvKey=(typeof serverKeys)[number];
export function infrastructureEnv(){const values=Object.fromEntries(serverKeys.map(k=>[k,process.env[k]?.trim()||""])) as Record<ServerEnvKey,string>;return {values,missing:serverKeys.filter(k=>!values[k])}}
