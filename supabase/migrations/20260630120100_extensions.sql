-- Concern: required Postgres extensions.
-- pgcrypto: gen_random_uuid() (PG16 also has it in core, but keep explicit/idempotent).
-- pgtap:    database unit tests (RLS, math, etc.).
create extension if not exists pgcrypto;
create extension if not exists pgtap;
