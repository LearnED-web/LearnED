-- ============================================================================
-- FIX: audit_logs RLS policies
-- Problem: Multiple conflicting policies on different roles
-- The admin uses 'authenticated' role, but some policies target 'public'
-- ============================================================================

-- Step 1: Drop ALL existing audit_logs policies to start clean
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Step 2: Make sure RLS is enabled
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 3: Create clean policies (all on 'authenticated' role since that's what logged-in users use)

-- Admins can see ALL audit logs (no restriction)
CREATE POLICY "admin_select_all_audit_logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'admin'
  )
);

-- Regular users can see only their own audit logs
CREATE POLICY "users_select_own_audit_logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anyone can insert audit logs (needed for triggers and functions)
CREATE POLICY "system_insert_audit_logs"
ON audit_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Service role bypass (SECURITY DEFINER functions already bypass RLS, 
-- but this ensures direct service_role calls also work)
-- Note: service_role bypasses RLS by default in Supabase, no policy needed

-- Step 4: Verify
SELECT policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'audit_logs';
