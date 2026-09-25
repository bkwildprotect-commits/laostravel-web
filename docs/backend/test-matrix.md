# Backend Safety Test Matrix

| Area | Automated coverage now | Production integration still required |
|---|---|---|
| Booking lifecycle | valid/invalid transitions | database status persistence |
| Partner free 5 | ordinal allocation/reuse/full | concurrent DB locking |
| NO_SHOW trial | releases free ordinal | transactional persistence |
| Idempotency | create/in-progress/replay/conflict decision | stored response replay |
| Inventory hold | active/expired/released | capacity locking + expiry worker |
| Commission math | integer money + versioned rate | active rule repository |
| Commission lifecycle | earn/void + unresolved NO_SHOW | ledger transaction |
| Booking orchestrator | ordering + duplicate short-circuit | concrete PostgreSQL repository |

No test in this repository should be interpreted as proof of production concurrency safety until the real PostgreSQL adapter and integration tests are connected.
