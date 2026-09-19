-- Prevent overlapping active bookings for the same resource.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('CONFIRMED', 'PENDING', 'COMPLETED'));
