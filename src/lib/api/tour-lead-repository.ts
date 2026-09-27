export type TourLeadRecord={id:string;submissionKey:string;requestHash:string;name:string;phone:string;email:string|null;requestedDate:string;guests:number;consent:true};
export type TourLeadInsertResult={kind:"CREATED";id:string}|{kind:"REPLAY";id:string}|{kind:"CONFLICT"};
export interface TourLeadRepository{insertOrResolve(input:TourLeadRecord):Promise<TourLeadInsertResult>}
