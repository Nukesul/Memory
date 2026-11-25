-- Phase 2: class photos open by direct link again (fast, cacheable). Writes stay strict.
-- Rollback: update storage.buckets set public = false where id = 'photos';
update storage.buckets set public = true where id = 'photos';
