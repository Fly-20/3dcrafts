-- Time-lapse fix T3 (HQ technical brief §7.1): Etsy often doesn't share the
-- buyer's email, so a time-lapse customer can now be saved by name only.
-- Additive and safe for existing rows: the unique constraint on email stays,
-- and Postgres allows any number of NULLs under a unique constraint. Website
-- orders (Stripe webhook) always have an email, so they're unaffected.
--
-- Run this after 0001-0005, before deploying the matching code.

alter table customers alter column email drop not null;
