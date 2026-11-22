ALTER TABLE private.visual_upload_tickets ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE private.visual_upload_tickets IS
  'Private one-time upload tickets. No client roles have schema or table access; trusted service_role consumes tickets through public.consume_visual_upload_ticket(text).';
