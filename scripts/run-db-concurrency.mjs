import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
const url=process.env.DATABASE_URL;
if(!url){console.error("DATABASE_URL is required for disposable PostgreSQL integration testing");process.exit(2)}
const partner=randomUUID(),user=randomUUID();
function psql(args,input){return new Promise(resolve=>{const p=spawn("psql",[url,"-v","ON_ERROR_STOP=1",...args],{stdio:["pipe","pipe","pipe"]});let out="",err="";p.stdout.on("data",d=>out+=d);p.stderr.on("data",d=>err+=d);p.on("close",code=>resolve({code,out,err}));p.stdin.end(input||"")})}
const seedSql="INSERT INTO users(id,email) VALUES('"+user+"','conc-"+user+"@example.invalid'); INSERT INTO partners(id,name) VALUES('"+partner+"','Concurrency Test Partner');";
const seed=await psql([],seedSql);if(seed.code!==0){console.error(seed.err);process.exit(1)}
const worker=booking=>psql(["-v","partner_id="+partner,"-v","user_id="+user,"-v","booking_id="+booking,"-v","ordinal=5","-f","db/integration/concurrency/trial-worker.sql"]);
const results=await Promise.all([worker(randomUUID()),worker(randomUUID())]);
const committed=results.filter(r=>r.code===0).length;
if(committed!==1){console.error("Expected exactly one concurrent ordinal-5 reservation to commit",results);process.exit(1)}
console.log("PASS: exactly one concurrent ordinal-5 trial reservation committed");
