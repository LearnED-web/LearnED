-- Function to completely delete a student account and all associated data
-- This is required for Play Store compliance (GDPR, data deletion requirements)

CREATE OR REPLACE FUNCTION admin_delete_student_account(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_student_record RECORD;
  v_deleted_tables TEXT[] := '{}';
BEGIN
  -- Get the student record
  SELECT s.*, u.email, u.first_name, u.last_name
  INTO v_student_record
  FROM students s
  JOIN users u ON s.user_id = u.id
  WHERE s.id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student not found'
    );
  END IF;
  
  v_user_id := v_student_record.user_id;
  
  -- Start deleting from child tables (order matters due to foreign keys)
  
  -- 1. Delete student assignment attempts
  DELETE FROM student_assignment_attempts WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'student_assignment_attempts');
  
  -- 2. Delete student progress
  DELETE FROM student_progress WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'student_progress');
  
  -- 3. Delete session attendance
  DELETE FROM session_attendance WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'session_attendance');
  
  -- 4. Delete payments
  DELETE FROM payments WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'payments');
  
  -- 5. Delete student enrollments
  DELETE FROM student_enrollments WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'student_enrollments');
  
  -- 6. Delete parent-student relations
  DELETE FROM parent_student_relations WHERE student_id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'parent_student_relations');
  
  -- 7. Delete system notifications for this user
  DELETE FROM system_notifications WHERE user_id = v_user_id;
  v_deleted_tables := array_append(v_deleted_tables, 'system_notifications');
  
  -- 8. Update classroom student counts for classrooms this student was enrolled in
  UPDATE classrooms c
  SET current_students = (
    SELECT COUNT(*) 
    FROM student_enrollments se 
    WHERE se.classroom_id = c.id AND se.status = 'active'
  )
  WHERE c.id IN (
    SELECT DISTINCT classroom_id 
    FROM student_enrollments 
    WHERE student_id = p_student_id
  );
  
  -- 9. Delete the student record
  DELETE FROM students WHERE id = p_student_id;
  v_deleted_tables := array_append(v_deleted_tables, 'students');
  
  -- 10. Log this action in audit_logs (use NULL for user_id since we're deleting the user)
  INSERT INTO audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    description,
    old_values,
    severity
  ) VALUES (
    NULL,  -- Set to NULL since we're deleting this user
    'DELETE_ACCOUNT',
    'students',
    p_student_id,
    'Student account permanently deleted by admin',
    jsonb_build_object(
      'student_id', v_student_record.student_id,
      'email', v_student_record.email,
      'name', v_student_record.first_name || ' ' || v_student_record.last_name,
      'deleted_user_id', v_user_id,
      'deleted_at', now()
    ),
    'critical'
  );
  
  -- 11. Delete admin_activities targeting this user (set to null or delete)
  UPDATE admin_activities SET target_user_id = NULL WHERE target_user_id = v_user_id;
  
  -- 12. Update existing audit_logs to remove reference to this user
  UPDATE audit_logs SET user_id = NULL WHERE user_id = v_user_id;
  
  -- 13. Delete the users record
  DELETE FROM users WHERE id = v_user_id;
  v_deleted_tables := array_append(v_deleted_tables, 'users');
  
  -- 14. Delete from Supabase auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  v_deleted_tables := array_append(v_deleted_tables, 'auth.users');
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student account and all associated data permanently deleted',
    'deleted_student', jsonb_build_object(
      'student_id', v_student_record.student_id,
      'email', v_student_record.email,
      'name', v_student_record.first_name || ' ' || v_student_record.last_name
    ),
    'deleted_from_tables', v_deleted_tables
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users (admin check is done in frontend/RLS)
GRANT EXECUTE ON FUNCTION admin_delete_student_account(UUID) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION admin_delete_student_account IS 'Permanently deletes a student account and all associated data. Required for Play Store/GDPR compliance.';
