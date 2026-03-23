CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_uid uuid;
    v_user public.users%ROWTYPE;
    v_teacher_blocked boolean := false;
    v_retention_until timestamp with time zone := now() + interval '7 years';
    v_existing_request_id uuid;
BEGIN
    v_uid := auth.uid();

    IF v_uid IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'unauthenticated',
            'message', 'You must be authenticated to request account deletion.'
        );
    END IF;

    SELECT *
    INTO v_user
    FROM public.users
    WHERE id = v_uid;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'user_not_found',
            'message', 'No profile found for the authenticated account.'
        );
    END IF;

    -- Check if request ALREADY exists in the explicit requests table
    SELECT id INTO v_existing_request_id 
    FROM public.account_deletion_requests 
    WHERE user_id = v_uid 
    LIMIT 1;

    -- REPAIR LOGIC: Only block if BOTH user status is requested AND the request row exists.
    -- If user status is 'requested' but row is missing, we proceed to create the row.
    IF COALESCE(v_user.deletion_status, 'active') = 'requested' AND v_existing_request_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'code', 'already_requested',
            'message', 'Account deletion has already been requested.',
            'scheduled_purge_at', v_user.scheduled_purge_at
        );
    END IF;

    IF v_user.user_type::text = 'teacher' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.teachers t
            JOIN public.classrooms c ON c.teacher_id = t.id
            JOIN public.student_enrollments se ON se.classroom_id = c.id
            WHERE t.user_id = v_uid
              AND se.status::text = 'active'
        ) INTO v_teacher_blocked;

        IF v_teacher_blocked THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'teacher_has_active_students',
                'message', 'Account deletion is blocked while active student enrollments exist. Please transfer or close classes first.'
            );
        END IF;
    END IF;

    -- Insert the missing request row
    INSERT INTO public.account_deletion_requests (
        user_id,
        requested_by,
        user_type,
        reason,
        status,              
        requested_at,        
        retention_until,
        metadata
    ) VALUES (
        v_uid,
        v_uid,
        v_user.user_type::text,
        p_reason,
        'pending',           -- Explicity Set status (Fix for Not Null constraint)
        now(),               -- Explicitly Set timestamp (Fix for Not Null constraint)
        v_retention_until,
        jsonb_build_object(
            'email', v_user.email,
            'requested_via', 'mobile_app',
            'retention_policy', 'legal_financial_records_7_years'
        )
    );

    -- Ensure user status is consistent (even if it was already 'requested', we update it to be safe)
    UPDATE public.users
    SET
        is_active = false,
        deletion_status = 'requested',
        deletion_requested_at = now(),
        scheduled_purge_at = v_retention_until,
        deletion_reason = p_reason,
        phone = NULL,
        profile_image_url = NULL,
        date_of_birth = NULL,
        address = NULL,
        city = NULL,
        state = NULL,
        country = NULL,
        postal_code = NULL,
        updated_at = now()
    WHERE id = v_uid;

    INSERT INTO public.trigger_logs (message, metadata)
    VALUES (
        'Account deletion requested',
        jsonb_build_object(
            'user_id', v_uid,
            'user_type', v_user.user_type,
            'retention_until', v_retention_until
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'deletion_requested',
        'message', 'Account deletion requested successfully. Your access has been disabled.',
        'retention_until', v_retention_until
    );
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.trigger_logs (message, error_message, metadata)
        VALUES (
            'request_account_deletion failed',
            SQLERRM,
            jsonb_build_object('user_id', auth.uid(), 'error_state', SQLSTATE)
        );

        RETURN jsonb_build_object(
            'success', false,
            'code', 'internal_error',
            'message', 'Failed to process account deletion request: ' || SQLERRM
        );
END;
$function$;
