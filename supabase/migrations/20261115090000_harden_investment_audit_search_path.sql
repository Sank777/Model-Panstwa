-- Harden the only SECURITY DEFINER function with a non-empty search_path.
-- All application objects referenced by this trigger are schema-qualified.
ALTER FUNCTION private.log_investment_audit_event()
  SET search_path = '';

REVOKE ALL ON FUNCTION private.log_investment_audit_event()
  FROM PUBLIC, anon, authenticated;

