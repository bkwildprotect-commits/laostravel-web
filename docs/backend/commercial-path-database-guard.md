# Commercial Path Database Guard

A booking must have exactly one commercial allocation path once allocation occurs: Partner free-trial ledger OR commission ledger, never both.

Migration 0004 adds symmetric PostgreSQL triggers. Each trigger takes a transaction-scoped advisory lock derived from booking_id before checking the opposite ledger. The shared lock key serializes concurrent attempts to insert trial and commission rows for the same booking, closing the race that two independent UNIQUE constraints cannot prevent.

Existing UNIQUE booking_id constraints still prevent duplicates within each ledger. Application-level Partner allocation locking remains required for selecting free ordinals 1-5. The database trigger is a final integrity barrier, not a replacement for the SERIALIZABLE booking transaction.

This migration has not been applied to a production database.
