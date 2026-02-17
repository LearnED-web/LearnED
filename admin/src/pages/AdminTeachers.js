import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminTeachers = () => {
  const { user, logout } = useAuth();
  const { adminData, refreshData } = useAdmin();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAllClassroomsModal, setShowAllClassroomsModal] = useState(false);
  const [showTeacherIdModal, setShowTeacherIdModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [invitationData, setInvitationData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    subject: '',
    grade_levels: ''
  });
  const [invitations, setInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState('teachers');

  const fetchInvitations = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase.rpc('get_teacher_invitations', {
        p_admin_id: user.id
      });
      if (error) {
        console.error('Error fetching invitations:', error);
        // Silently fail - don't show alert popup
        setInvitations([]);
      } else {
        setInvitations(data || []);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const teachers = adminData.teachers || [];
  const classrooms = adminData.classrooms || [];

  // Get classrooms assigned to a specific teacher
  const getTeacherClassrooms = (teacherId) => {
    return classrooms.filter(classroom => classroom.teacher_id === teacherId);
  };

  const handleAssignClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowAssignModal(true);
  };

  // Filter teachers based on search and subject
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.users?.first_name || ''} ${teacher.users?.last_name || ''}`.toLowerCase();
    const email = teacher.users?.email?.toLowerCase() || '';
    const searchMatch = searchTerm === '' || 
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());
    
    const subjectMatch = subjectFilter === '' || 
      (teacher.specializations && teacher.specializations.includes(subjectFilter));
    
    return searchMatch && subjectMatch;
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = '/'; // Redirect to main website
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      // Check current auth state and admin privileges
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Authentication error. Please login again.');
        return;
      }
      
      // Verify admin access
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id, email, user_type, is_active')
        .eq('id', user.id)
        .single();
        
      if (dbError || !dbUser || dbUser.user_type !== 'admin') {
        alert('Access denied: Admin privileges required');
        return;
      }
      
      // Update teacher profile
      const teacherResult = await supabase
        .from('teachers')
        .update({
          qualifications: editData.qualifications,
          experience_years: parseInt(editData.experience_years) || 0,
          hourly_rate: parseFloat(editData.hourly_rate) || null,
          bio: editData.bio,
          status: editData.is_active === 'true' ? 'active' : 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', editId);
      
      if (teacherResult.error) {
        console.error('Teacher update failed:', teacherResult.error);
        alert(`Failed to update teacher: ${teacherResult.error.message}`);
        return;
      }

      // Update user information
      const userResult = await supabase
        .from('users')
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          phone: editData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editData.user_id);

      if (userResult.error) {
        console.error('User update failed:', userResult.error);
        alert(`Failed to update user information: ${userResult.error.message}`);
        return;
      }
      
      alert('Teacher updated successfully!');
      setShowEditModal(false);
      setEditId(null);
      setEditData({});
      await refreshData();
      
    } catch (error) {
      console.error('Update teacher failed:', error);
      alert('Failed to update teacher: ' + error.message);
    }
  };

  const handleStatusChange = async (teacher, newStatus) => {
    if (newStatus === 'not_set') {
      alert('Cannot set status to "Not Set". Please choose Active or Inactive.');
      return;
    }

    const statusText = newStatus === 'active' ? 'Active' : 'Inactive';
    const confirmMessage = newStatus === 'inactive' 
      ? `Are you sure you want to set ${teacher.users.first_name} to Inactive? This will remove them from all assigned classrooms.`
      : `Are you sure you want to set ${teacher.users.first_name} to ${statusText}?`;

    if (window.confirm(confirmMessage)) {
      try {
        // Debug: Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        
        if (!session) {
          alert('Authentication session expired. Please log in again.');
          return;
        }

        // If setting to inactive, first unassign from all classrooms
        if (newStatus === 'inactive') {
          const { error: unassignError } = await supabase
            .from('classrooms')
            .update({ teacher_id: null, updated_at: new Date().toISOString() })
            .eq('teacher_id', teacher.id);

          if (unassignError) {
            console.error('Unassign error:', unassignError);
            alert('Failed to unassign teacher from classrooms: ' + unassignError.message);
            return;
          }
        }

        // Update teacher status
        const { error } = await supabase
          .from('teachers')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', teacher.id);

        if (error) {
          console.error('Status update error:', error);
          throw error;
        }

        await refreshData();
        alert(`Teacher status updated to ${statusText}.`);
      } catch (error) {
        console.error('Status update failed:', error);
        alert('Failed to update teacher status: ' + error.message);
      }
    }
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    const confirmText = `⚠️ DANGEROUS ACTION ⚠️\n\nAre you ABSOLUTELY SURE you want to permanently DELETE the teacher "${teacherName}"?\n\nThis action:\n• CANNOT be undone\n• Will REMOVE them from ALL assigned classrooms\n• Will DELETE all their data permanently\n\nType "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmText);
    
    if (userInput !== "DELETE") {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    try {
      // Call the database function that handles ALL cleanup in one transaction:
      // classrooms (unassign), teacher_documents, teacher_verification,
      // learning_materials, assignment_questions, assignments,
      // student_assignment_attempts, system_notifications, teacher_invitations,
      // teachers, audit_logs, admin_activities, users, and auth.users
      const { data, error } = await supabase.rpc('admin_delete_teacher_account', {
        p_teacher_id: teacherId
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete teacher');
      }

      console.log('✅ Teacher deleted:', data.deleted_teacher);
      console.log('📋 Cleaned up tables:', data.deleted_from_tables);

      alert('Teacher deleted successfully! All records have been cleaned up.');
      await refreshData();
    } catch (error) {
      console.error('Delete teacher failed:', error);
      alert('Failed to delete teacher: ' + error.message);
    }
  };

  // Assign teacher to classroom

  const handleConfirmAssign = async (classroomId) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ 
          teacher_id: selectedTeacher.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', classroomId);

      if (error) {
        console.error('Classroom assignment error:', error);
        alert('Failed to assign teacher to classroom: ' + error.message);
        return;
      }

      alert('Teacher assigned to classroom successfully!');
      await refreshData();
      const updatedTeacher = { ...selectedTeacher, classrooms: getTeacherClassrooms(selectedTeacher.id) };
      setSelectedTeacher(updatedTeacher);
    } catch (error) {
      console.error('Assign teacher failed:', error);
      alert('Failed to assign teacher: ' + error.message);
    }
  };

  const handleDeassignClick = async (classroomId) => {
    if (!selectedTeacher) return;
  
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) return;
  
    if (window.confirm(`Are you sure you want to de-assign ${selectedTeacher.users.first_name} from ${classroom.name}?`)) {
      try {
        const { error } = await supabase
          .from('classrooms')
          .update({ teacher_id: null })
          .eq('id', classroomId);
  
        if (error) {
          throw error;
        }
  
        await refreshData();
        alert('Teacher de-assigned successfully.');
        const updatedTeacher = { ...selectedTeacher, classrooms: getTeacherClassrooms(selectedTeacher.id) };
        setSelectedTeacher(updatedTeacher);
      } catch (error) {
        console.error('De-assign teacher failed:', error);
        alert('Failed to de-assign teacher: ' + error.message);
      }
    }
  };

  // Handle assignment from global classroom view
  const handleAssignTeacherToClassroom = async (classroomId, teacherId) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ 
          teacher_id: teacherId,
          updated_at: new Date().toISOString()
        })
        .eq('id', classroomId);

      if (error) {
        console.error('Classroom assignment error:', error);
        alert('Failed to assign teacher to classroom: ' + error.message);
        return;
      }

      alert('Teacher assigned to classroom successfully!');
      await refreshData();
    } catch (error) {
      console.error('Assign teacher failed:', error);
      alert('Failed to assign teacher: ' + error.message);
    }
  };

  // Handle deassignment from global classroom view
  const handleDeassignFromClassroom = async (classroomId, classroomName, teacherName) => {
    if (window.confirm(`Are you sure you want to de-assign ${teacherName} from ${classroomName}?`)) {
      try {
        const { error } = await supabase
          .from('classrooms')
          .update({ teacher_id: null, updated_at: new Date().toISOString() })
          .eq('id', classroomId);

        if (error) {
          throw error;
        }

        await refreshData();
        alert('Teacher de-assigned successfully.');
      } catch (error) {
        console.error('De-assign teacher failed:', error);
        alert('Failed to de-assign teacher: ' + error.message);
      }
    }
  };

  const handleSendInvitation = async () => {
    console.log('🚀 [AdminTeachers] handleSendInvitation called with:', invitationData);
    try {
      if (!invitationData.first_name?.trim() || !invitationData.last_name?.trim() || !invitationData.email?.trim()) {
        alert('Please fill in all required fields (First Name, Last Name, Email)');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invitationData.email.trim())) {
        alert('Please enter a valid email address');
        return;
      }

      const gradeLevels = invitationData.grade_levels.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      console.log('📊 Parsed grade levels:', gradeLevels);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Admin user:', user?.id);
      if (!user) {
        alert('Admin authentication required');
        return;
      }

      console.log('📤 Calling create_teacher_invitation RPC...');
      const { data: invitationResult, error } = await supabase.rpc('create_teacher_invitation', {
        p_email: invitationData.email,
        p_first_name: invitationData.first_name,
        p_last_name: invitationData.last_name,
        p_subject: invitationData.subject || null,
        p_grade_levels: gradeLevels.length > 0 ? gradeLevels : null,
        p_admin_id: user.id
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      console.log('✅ Invitation created:', invitationResult);

      // Step 2: Send invite email via server-side API
      // Uses Supabase Admin API (inviteUserByEmail) which sends the "Invite User" email template
      // This template has {{ .ConfirmationURL }} = a clickable magic link, NOT an OTP code
      console.log('📧 Sending teacher invite email via API...');
      const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'https://learnedtech.in';
      const redirectUrl = `${frontendUrl}/teacher/onboard`;
      console.log('📍 Redirect URL:', redirectUrl);

      // Get admin's access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/invite-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: invitationData.email,
          redirectTo: redirectUrl,
          userData: {
            user_type: 'teacher',
            first_name: invitationData.first_name,
            last_name: invitationData.last_name,
            invitation_id: invitationResult.invitation_id
          }
        })
      });

      const result = await response.json();
      console.log('📬 Invite API Response:', result);

      if (!response.ok) {
        console.error('❌ Email sending error:', result.error);
        alert('Invitation created but email failed to send: ' + result.error + '\n\nThe teacher can still complete onboarding by visiting the teacher onboarding page and entering their email.');
      } else {
        console.log('✅ Teacher invite email sent successfully');
        alert('Teacher invitation sent successfully! They will receive an email with a link to complete their profile.');
      }

      setShowInviteModal(false);
      setInvitationData({ first_name: '', last_name: '', email: '', subject: '', grade_levels: '' });
      fetchInvitations(); // Refresh invitations list
    } catch (error) {
      console.error('💥 Send invitation failed:', error);
      alert('Failed to send invitation: ' + error.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert('Admin authentication required');
          return;
        }

        const { data, error } = await supabase.rpc('cancel_teacher_invitation', {
          p_invitation_id: invitationId,
          p_admin_id: user.id
        });

        if (error) throw error;

        if (data.success) {
          alert('Invitation cancelled successfully.');
          fetchInvitations();
        } else {
          alert('Failed to cancel invitation: ' + data.error);
        }
      } catch (error) {
        console.error('Cancel invitation failed:', error);
        alert('Failed to cancel invitation: ' + error.message);
      }
    }
  };

  const handleNewInvitationChange = (e) => {
    setInvitationData({ ...invitationData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Admin Navigation Tabs */}
          <nav className="mt-6">
            <div className="flex space-x-8">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/classrooms')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Classrooms
              </button>
              <button
                onClick={() => navigate('/teachers')}
                className="border-b-2 border-blue-500 text-blue-600 px-3 py-2 font-medium text-sm"
              >
                Teachers
              </button>
              <button
                onClick={() => navigate('/students')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Students
              </button>
              <button
                onClick={() => navigate('/payment-approvals')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Payment Approvals
              </button>
              <button
                onClick={() => navigate('/grade-pricing')}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Grade Pricing
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Manage Teachers & Invitations</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Invite New Teacher
                </button>
                <button 
                  onClick={() => setShowAllClassroomsModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2"></path>
                  </svg>
                  View All Classrooms
                </button>
              </div>

              {/* Tabs for Teachers and Invitations */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('teachers')}
                    className={`${
                      activeTab === 'teachers'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Current Teachers
                  </button>
                  <button
                    onClick={() => setActiveTab('invitations')}
                    className={`${
                      activeTab === 'invitations'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Pending Invitations
                  </button>
                </nav>
              </div>

              {activeTab === 'teachers' && (
                <>
                  {/* Search and Filters */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label htmlFor="search" className="sr-only">Search teachers</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                          </div>
                          <input
                            id="search"
                            type="text"
                            placeholder="Search teachers by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="sm:w-48">
                        <label htmlFor="subject-filter" className="sr-only">Filter by subject</label>
                        <select
                          id="subject-filter"
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">All Subjects</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="English">English</option>
                          <option value="Social Studies">Social Studies</option>
                          <option value="Languages">Languages</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {activeTab === 'teachers' && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qualifications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Classrooms Assigned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          View ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {teacher.users?.first_name} {teacher.users?.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.users?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.qualifications || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.experience_years || 0} years
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {(() => {
                              const assignedClassrooms = getTeacherClassrooms(teacher.id);
                              return (
                                <button
                                  onClick={() => handleAssignClick(teacher)}
                                  className="text-blue-600 hover:underline"
                                >
                                  {assignedClassrooms.length} classroom(s)
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teacher.rating ? `${teacher.rating}/5` : 'No rating'} ({teacher.total_reviews || 0} reviews)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              teacher.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : teacher.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {teacher.status === 'active' ? 'Active' : teacher.status === 'inactive' ? 'Inactive' : 'Not Set'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowTeacherIdModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100"
                            >
                              View ID
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <select
                                value={teacher.status || 'not_set'}
                                onChange={(e) => handleStatusChange(teacher, e.target.value)}
                                className={`text-sm border rounded-md px-2 py-1 font-medium transition-colors duration-200 ${
                                  teacher.status === 'active'
                                    ? 'border-green-300 text-green-700 bg-green-50'
                                    : teacher.status === 'inactive'
                                    ? 'border-red-300 text-red-700 bg-red-50'
                                    : 'border-gray-300 text-gray-700 bg-gray-50'
                                }`}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="not_set" disabled>Not Set</option>
                              </select>
                              <button 
                                onClick={() => handleDeleteTeacher(teacher.id, `${teacher.users?.first_name} ${teacher.users?.last_name}`)}
                                className="inline-flex items-center px-3 py-1.5 border-2 border-red-500 text-red-700 bg-red-100 hover:bg-red-200 hover:border-red-600 rounded-md text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                title="⚠️ DANGER: This will permanently delete the teacher!"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                ⚠️ DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          {teachers.length === 0 ? 'No teachers found' : 'No teachers match your search criteria'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden mt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invitations.length > 0 ? (
                        invitations.map((invite) => (
                          <tr key={invite.invitation_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invite.first_name} {invite.last_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invite.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {invite.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invite.expires_at).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {invite.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelInvitation(invite.invitation_id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No invitations found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Teacher</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={editData.last_name || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editData.phone || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={editData.experience_years || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    name="hourly_rate"
                    value={editData.hourly_rate || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                  <textarea
                    name="qualifications"
                    rows="3"
                    value={editData.qualifications || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    value={editData.bio || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="is_active"
                    value={editData.is_active || 'true'}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditId(null);
                    setEditData({});
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite New Teacher Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Teacher</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="first_name"
                    value={invitationData.first_name}
                    onChange={handleNewInvitationChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="last_name"
                    value={invitationData.last_name}
                    onChange={handleNewInvitationChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={invitationData.email}
                    onChange={handleNewInvitationChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={invitationData.subject}
                    onChange={handleNewInvitationChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade Levels</label>
                  <input
                    type="text"
                    name="grade_levels"
                    value={invitationData.grade_levels}
                    onChange={handleNewInvitationChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., 9, 10, 11"
                  />
                   <p className="text-xs text-gray-500 mt-1">Comma-separated values.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Classroom Modal */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Classrooms for {selectedTeacher.users.first_name} {selectedTeacher.users.last_name}
              </h3>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Currently Assigned:</h4>
                {getTeacherClassrooms(selectedTeacher.id).length > 0 ? (
                  <ul className="space-y-2">
                    {getTeacherClassrooms(selectedTeacher.id).map(classroom => (
                      <li key={classroom.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                        <span>{classroom.name} ({classroom.subject})</span>
                        <button
                          onClick={() => handleDeassignClick(classroom.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          De-assign
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Not assigned to any classrooms.</p>
                )}
              </div>

              <hr className="my-6" />

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Available Classrooms (Unassigned):</h4>
                <ul className="space-y-2">
                  {classrooms.filter(c => !c.teacher_id).map(classroom => (
                    <li key={classroom.id} className="flex justify-between items-center bg-white p-2 rounded-md border">
                      <span>{classroom.name} ({classroom.subject})</span>
                      <button
                        onClick={() => handleConfirmAssign(classroom.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm font-semibold"
                      >
                        Assign
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTeacher(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Classrooms Modal */}
      {showAllClassroomsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                All Classrooms - Assignment Status
              </h3>
              
              <div className="space-y-6">
                {/* Assigned Classrooms */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Assigned Classrooms ({classrooms.filter(c => c.teacher_id).length})
                  </h4>
                  {classrooms.filter(c => c.teacher_id).length > 0 ? (
                    <div className="space-y-2">
                      {classrooms.filter(c => c.teacher_id).map(classroom => {
                        const teacher = teachers.find(t => t.id === classroom.teacher_id);
                        return (
                          <div key={classroom.id} className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded-md">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{classroom.name}</div>
                              <div className="text-sm text-gray-600">
                                {classroom.subject} • Grade {classroom.grade_level}
                              </div>
                              {teacher && (
                                <div className="text-sm text-green-700 font-medium mt-1">
                                  👤 {teacher.users?.first_name} {teacher.users?.last_name}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeassignFromClassroom(
                                classroom.id, 
                                classroom.name, 
                                teacher ? `${teacher.users?.first_name} ${teacher.users?.last_name}` : 'teacher'
                              )}
                              className="ml-4 text-red-500 hover:text-red-700 text-sm font-semibold bg-white px-3 py-1.5 rounded border border-red-300 hover:bg-red-50"
                            >
                              De-assign
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No classrooms are currently assigned.</p>
                  )}
                </div>

                <hr className="my-4" />

                {/* Unassigned Classrooms */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Unassigned Classrooms ({classrooms.filter(c => !c.teacher_id).length})
                  </h4>
                  {classrooms.filter(c => !c.teacher_id).length > 0 ? (
                    <div className="space-y-2">
                      {classrooms.filter(c => !c.teacher_id).map(classroom => (
                        <div key={classroom.id} className="flex justify-between items-center bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{classroom.name}</div>
                            <div className="text-sm text-gray-600">
                              {classroom.subject} • Grade {classroom.grade_level}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignTeacherToClassroom(classroom.id, e.target.value);
                                  e.target.value = ''; // Reset select
                                }
                              }}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
                              defaultValue=""
                            >
                              <option value="" disabled>Select Teacher...</option>
                              {teachers.filter(t => t.status === 'active').map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.users?.first_name} {teacher.users?.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">All classrooms have been assigned!</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAllClassroomsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher ID Modal */}
      {showTeacherIdModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold text-white">Teacher ID</h2>
              <button
                onClick={() => setShowTeacherIdModal(false)}
                className="text-white hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedTeacher.users?.first_name} {selectedTeacher.users?.last_name}
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-mono text-gray-900 break-all text-center">{selectedTeacher.id}</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center">
                User ID: {selectedTeacher.user_id}
              </p>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-lg">
              <button
                onClick={() => setShowTeacherIdModal(false)}
                className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium text-white hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
