-- Complete teacher account deletion function
-- Mirrors admin_delete_student_account but for teachers
-- Handles ALL related tables in correct order (foreign key dependencies)

CREATE OR REPLACE FUNCTION admin_delete_teacher_account(p_teacher_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_teacher_record RECORD;
  v_deleted_tables TEXT[] := '{}';
BEGIN
  -- Get the teacher record
  SELECT t.*, u.email, u.first_name, u.last_name
  INTO v_teacher_record
  FROM teachers t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = p_teacher_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Teacher not found'
    );
  END IF;
  
  v_user_id := v_teacher_record.user_id;
  
  -- Start deleting from child tables (order matters due to foreign keys)
  
  -- 1. Unassign teacher from all classrooms
  UPDATE classrooms 
  SET teacher_id = NULL, updated_at = now() 
  WHERE teacher_id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'classrooms (unassigned)');
  
  -- 2. Delete teacher documents
  DELETE FROM teacher_documents WHERE teacher_id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'teacher_documents');
  
  -- 3. Delete teacher verification records
  DELETE FROM teacher_verification WHERE teacher_id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'teacher_verification');
  
  -- 4. Delete learning materials created by this teacher
  DELETE FROM learning_materials WHERE teacher_id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'learning_materials');
  
  -- 5. Delete assignments created by this teacher
  -- First delete assignment questions
  DELETE FROM assignment_questions 
  WHERE assignment_id IN (SELECT id FROM assignments WHERE teacher_id = p_teacher_id);
  v_deleted_tables := array_append(v_deleted_tables, 'assignment_questions');
  
  -- Then delete the assignments themselves
  DELETE FROM assignments WHERE teacher_id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'assignments');
  
  -- 6. Update student_assignment_attempts where graded_by = this teacher
  UPDATE student_assignment_attempts SET graded_by = NULL WHERE graded_by = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'student_assignment_attempts (graded_by cleared)');
  
  -- 7. Delete system notifications for this user
  DELETE FROM system_notifications WHERE user_id = v_user_id;
  v_deleted_tables := array_append(v_deleted_tables, 'system_notifications');
  
  -- 8. Delete teacher invitations for this email
  DELETE FROM teacher_invitations WHERE email = v_teacher_record.email;
  v_deleted_tables := array_append(v_deleted_tables, 'teacher_invitations');
  
  -- 9. Delete the teacher record
  DELETE FROM teachers WHERE id = p_teacher_id;
  v_deleted_tables := array_append(v_deleted_tables, 'teachers');
  
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
    NULL,
    'DELETE_ACCOUNT',
    'teachers',
    p_teacher_id,
    'Teacher account permanently deleted by admin',
    jsonb_build_object(
      'teacher_id', v_teacher_record.teacher_id,
      'email', v_teacher_record.email,
      'name', v_teacher_record.first_name || ' ' || v_teacher_record.last_name,
      'deleted_user_id', v_user_id,
      'deleted_at', now()
    ),
    'critical'
  );
  
  -- 11. Delete admin_activities targeting this user
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
    'message', 'Teacher account and all associated data permanently deleted',
    'deleted_teacher', jsonb_build_object(
      'teacher_id', v_teacher_record.teacher_id,
      'email', v_teacher_record.email,
      'name', v_teacher_record.first_name || ' ' || v_teacher_record.last_name
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
