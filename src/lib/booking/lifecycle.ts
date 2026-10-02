import type {TrialStatus} from "@/lib/commission/trial";
export type BookingStatus="REQUESTED"|"CONFIRMED"|"CHECKED_IN"|"IN_SERVICE"|"COMPLETED"|"CANCELLED"|"EXPIRED"|"NO_SHOW";
export type BookingEvent="CONFIRM"|"CHECK_IN"|"START_SERVICE"|"COMPLETE"|"CANCEL"|"EXPIRE"|"MARK_NO_SHOW";
const transitions:Record<BookingStatus,Partial<Record<BookingEvent,BookingStatus>>>={
 REQUESTED:{CONFIRM:"CONFIRMED",CANCEL:"CANCELLED",EXPIRE:"EXPIRED"},
 CONFIRMED:{CHECK_IN:"CHECKED_IN",CANCEL:"CANCELLED",MARK_NO_SHOW:"NO_SHOW"},
 CHECKED_IN:{START_SERVICE:"IN_SERVICE",COMPLETE:"COMPLETED",CANCEL:"CANCELLED"},
 IN_SERVICE:{COMPLETE:"COMPLETED"},COMPLETED:{},CANCELLED:{},EXPIRED:{},NO_SHOW:{}
};
export function transitionBooking(status:BookingStatus,event:BookingEvent):BookingStatus{const next=transitions[status][event];if(!next)throw new Error(`Invalid booking transition: ${status} -> ${event}`);return next}
export type TrialLifecycleAction="NONE"|"CONSUME"|"RELEASE";
export function trialActionForTransition(currentTrial:TrialStatus|undefined,nextBooking:BookingStatus):TrialLifecycleAction{
 if(!currentTrial)return "NONE";if(nextBooking==="COMPLETED"&&currentTrial==="RESERVED")return "CONSUME";
 if((nextBooking==="CANCELLED"||nextBooking==="EXPIRED"||nextBooking==="NO_SHOW")&&currentTrial==="RESERVED")return "RELEASE";return "NONE";
}
