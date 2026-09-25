# Booking and Inventory Lifecycle

For an ACTIVE hold:
- booking CONFIRMED -> CONSUME the hold; the reserved unit is now committed inventory.
- booking CANCELLED before confirmation -> RELEASE the hold.
- booking EXPIRED -> EXPIRE the hold and restore availability.
- payment failure while the hold is still ACTIVE -> RELEASE the hold.

A CONSUMED hold is not automatically restored by generic lifecycle code. Cancellation/refund policy after confirmation is category/policy dependent and must use an explicit inventory-restoration operation once those rules are approved.

COMPLETED and NO_SHOW never restore consumed inventory automatically. This prevents accidental overselling caused by returning already-committed capacity.
