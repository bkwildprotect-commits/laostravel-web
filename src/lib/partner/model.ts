export const partnerCategories=["hotel","restaurant","attraction","tour-activity","transport","car-rental","guide"] as const;
export type PartnerCategory=(typeof partnerCategories)[number];
export type PartnerApplicationStatus="DRAFT"|"SUBMITTED"|"UNDER_REVIEW"|"NEEDS_CHANGES"|"RESUBMITTED"|"REJECTED"|"VERIFIED";
export type BusinessStatus="DRAFT"|"ACTIVE"|"SUSPENDED"|"CLOSED";
export type ServiceStatus="DRAFT"|"REVIEW"|"ACTIVE";
export type PartnerApplicationDraft={category?:PartnerCategory;businessName?:string;contactName?:string;email?:string;phone?:string;area?:string;status:PartnerApplicationStatus};
