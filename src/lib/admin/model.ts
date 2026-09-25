export const adminModules=["partners","services","bookings","reviews","rewards","emergency","audit"] as const;
export type AdminModule=(typeof adminModules)[number];
export type ReviewModerationStatus="PUBLISHED"|"FLAGGED"|"UNDER_REVIEW"|"REMOVED";
export type EmergencyContactRecord={id:string;area:string;type:string;name:string;phone:string;priority:number;active:boolean;verifiedAt:string|null};
export type AuditEvent={id:string;actorId:string;action:string;targetType:string;targetId:string;createdAt:string};
