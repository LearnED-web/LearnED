import React, { useState, useMemo } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';
import { EDUCATION_BOARDS, GRADE_LEVELS, SUBJECTS } from '../constants';

const ClassroomList = () => {
  const { adminData, refreshData } = useAdmin();
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationData, setInvitationData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    subject: '',
    gradeLevels: []
  });
  const [newClassroomData, setNewClassroomData] = useState({
    name: '',
    subject: '',
    custom_subject: '',
    grade_level: '',
    board: '',
    custom_board: '',
    description: '',
    max_students: 30,
    is_active: 'true',
    teacher_id: '',
    monthly_price: '',
    quarterly_price: '',
    yearly_price: ''
  });

  const classrooms = useMemo(() => {
    const allClassrooms = adminData.classrooms || [];
    return allClassrooms;
  }, [adminData.classrooms]);

  // Filter classrooms client-side
  const filteredClassrooms = classrooms.filter(cls => {
    const matchesBoard = !boardFilter || cls.board === boardFilter;
    const matchesGrade = !gradeFilter || String(cls.grade_level) === String(gradeFilter);
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && cls.is_active === true) ||
      (statusFilter === 'inactive' && cls.is_active === false) ||
      (statusFilter === 'null' && cls.is_active === null);
    const matchesSearch = !searchQuery || 
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.board?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teachers?.users?.first_name + ' ' + cls.teachers?.users?.last_name)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBoard && matchesGrade && matchesStatus && matchesSearch;
  });

  // Get pricing for different plans
  const getPrice = (classroom, planType) => {
    if (!classroom.classroom_pricing) return '-';
    
    // Look for pricing by billing_cycle or payment_plan_id
    const pricing = classroom.classroom_pricing.find(p => 
      p.payment_plan_id === planType || 
      p.payment_plans?.billing_cycle === planType ||
      p.payment_plans?.id === planType
    );
    
    return pricing?.price || '-';
  };

  const getPricingId = (classroom, planType) => {
    if (!classroom.classroom_pricing) return null;
    
    const pricing = classroom.classroom_pricing.find(p => 
      p.payment_plan_id === planType || 
      p.payment_plans?.billing_cycle === planType ||
      p.payment_plans?.id === planType
    );
    return pricing?.id;
  };

  const handleEdit = (cls) => {
    setEditId(cls.id);
    setEditData({ 
      ...cls, 
      monthly_price: getPrice(cls, 'monthly_basic'),
      quarterly_price: getPrice(cls, 'quarterly_standard'), 
      yearly_price: getPrice(cls, 'yearly_premium'),
      teacher_id: cls.teacher_id || '',
      teacher_name: cls.teachers?.users?.first_name + ' ' + cls.teachers?.users?.last_name || '',
      is_active: cls.is_active === true ? 'true' : cls.is_active === false ? 'false' : 'null'
    });
    setShowEditModal(true);
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
      
      // Update classroom
      const classroomResult = await supabase
        .from('classrooms')
        .update({
          name: editData.name,
          description: editData.description,
          board: editData.board,
          grade_level: editData.grade_level,
          subject: editData.subject,
          max_students: parseInt(editData.max_students) || 30,
          is_active: editData.is_active === 'true' ? true : editData.is_active === 'false' ? false : null,
          teacher_id: editData.teacher_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editId);
      
      if (classroomResult.error) {
        console.error('Classroom update failed:', classroomResult.error);
        
        // Handle specific RLS error
        if (classroomResult.error.code === '42501' || classroomResult.status === 403) {
          alert('Permission denied. Please check if you have admin access and RLS policies allow this update.');
        } else {
          alert(`Failed to update classroom: ${classroomResult.error.message}`);
        }
        return;
      }
      
      // Update or insert pricing for each plan
      const plans = ['monthly','quarterly', 'yearly'];
      const planIdMapping = {
        'monthly': 'monthly_basic',
        'quarterly': 'quarterly_standard', 
        'yearly': 'yearly_premium'
      };
      
      for (const plan of plans) {
        const price = editData[`${plan}_price`];
        const pricingId = getPricingId(classrooms.find(c => c.id === editId), planIdMapping[plan]);
        
        if (price && price !== '-') {
          if (pricingId) {
            // Update existing pricing
            const updateResult = await supabase.from('classroom_pricing').update({ price }).eq('id', pricingId);
            if (updateResult.error) {
              console.error(`${plan} update error:`, updateResult.error);
            }
          } else {
            // Insert new pricing
            const insertResult = await supabase.from('classroom_pricing').insert({
              classroom_id: editId,
              payment_plan_id: planIdMapping[plan],
              price
            });
            if (insertResult.error) {
              console.error(`${plan} insert error:`, insertResult.error);
            }
          }
        } else if (pricingId) {
          // Delete pricing if price is empty or '-'
          const deleteResult = await supabase.from('classroom_pricing').delete().eq('id', pricingId);
          if (deleteResult.error) {
            console.error(`${plan} delete error:`, deleteResult.error);
          }
        }
      }
      
      setEditId(null);
      setShowEditModal(false);
      refreshData('classrooms');
      alert('Classroom updated successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed: ' + error.message);
    }
  };

  const handleAddClassroom = async () => {
    try {
      const resolvedSubject = newClassroomData.subject === 'other'
        ? newClassroomData.custom_subject.trim()
        : newClassroomData.subject;
      const resolvedBoard = newClassroomData.board === 'other'
        ? newClassroomData.custom_board.trim()
        : newClassroomData.board;

      if (!resolvedSubject || !resolvedBoard) {
        alert('Please select subject/board or enter custom values.');
        return;
      }

      // Create classroom record (id will be auto-generated by database)
      const { data: classroomData, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          name: newClassroomData.name,
          subject: resolvedSubject,
          grade_level: parseInt(newClassroomData.grade_level),
          board: resolvedBoard,
          description: newClassroomData.description,
          max_students: parseInt(newClassroomData.max_students),
          teacher_id: newClassroomData.teacher_id || null,
          is_active: newClassroomData.is_active === 'true' ? true : newClassroomData.is_active === 'false' ? false : null
        })
        .select(); // Add .select() to return the inserted row

      if (classroomError) {
        console.error('Classroom creation error:', classroomError);
        alert('Failed to create classroom: ' + classroomError.message);
        return;
      }

      // Get the auto-generated classroom ID
      const classroomId = classroomData[0].id;

      // Create pricing records for different plans
      const pricingInserts = [];
      
      if (newClassroomData.monthly_price) {
        pricingInserts.push({
          classroom_id: classroomId,
          payment_plan_id: 'monthly_basic',
          price: parseFloat(newClassroomData.monthly_price)
        });
      }
      
      if (newClassroomData.quarterly_price) {
        pricingInserts.push({
          classroom_id: classroomId,
          payment_plan_id: 'quarterly_standard',
          price: parseFloat(newClassroomData.quarterly_price)
        });
      }
      
      if (newClassroomData.yearly_price) {
        pricingInserts.push({
          classroom_id: classroomId,
          payment_plan_id: 'yearly_premium',
          price: parseFloat(newClassroomData.yearly_price)
        });
      }

      if (pricingInserts.length > 0) {
        const { error: pricingError } = await supabase
          .from('classroom_pricing')
          .insert(pricingInserts);

        if (pricingError) {
          console.error('Pricing creation error:', pricingError);
          alert('Classroom created but failed to set pricing: ' + pricingError.message);
        }
      }

      // Reset form and close modal
      setNewClassroomData({
        name: '',
        subject: '',
        custom_subject: '',
        grade_level: '',
        board: '',
        custom_board: '',
        description: '',
        max_students: 30,
        is_active: 'true',
        teacher_id: '',
        monthly_price: '',
        quarterly_price: '',
        yearly_price: ''
      });
      setShowAddModal(false);
      
      // Refresh data
      refreshData('classrooms');
      alert('Classroom created successfully!');
      
    } catch (error) {
      console.error('Add classroom failed:', error);
      alert('Failed to add classroom: ' + error.message);
    }
  };

  const handleOpenInviteModal = (contextData) => {
    setInvitationData({
      email: '',
      firstName: '',
      lastName: '',
      subject: contextData.subject || '',
      gradeLevels: contextData.grade_level ? [parseInt(contextData.grade_level)] : []
    });
    setShowInviteModal(true);
  };

  const handleInvitationChange = (e) => {
    const { name, value } = e.target;
    setInvitationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendInvitation = async () => {
    console.log('🚀 handleSendInvitation called with:', invitationData);
    try {
      if (!invitationData.email || !invitationData.firstName || !invitationData.lastName) {
        alert('Please fill in all required fields (Email, First Name, Last Name)');
        return;
      }

      // Step 2: Send invite email via server-side API
      // Uses Supabase Admin API (inviteUserByEmail) which sends the "Invite User" email template
      // This template has {{ .ConfirmationURL }} = a clickable magic link, NOT an OTP code
      console.log('Sending teacher invite email via API...');
      const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'https://learnedtech.in';
      const redirectUrl = `${frontendUrl}/teacher/onboard`;
      console.log('Redirect URL:', redirectUrl);

      // Get admin's access token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Admin session expired. Please login again.');
        return;
      }

      const sendInvite = async (reinvite = false) => {
        const response = await fetch('/api/invite-teacher', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: invitationData.email.trim(),
            redirectTo: redirectUrl,
            reinvite,
            invitationData: {
              first_name: invitationData.firstName.trim(),
              last_name: invitationData.lastName.trim(),
              subject: invitationData.subject?.trim() || null,
              grade_levels: invitationData.gradeLevels.length > 0 ? invitationData.gradeLevels : null,
            },
            userData: {
              user_type: 'teacher',
              first_name: invitationData.firstName.trim(),
              last_name: invitationData.lastName.trim(),
            }
          })
        });

        const result = await response.json();
        return { response, result };
      };

      let { response, result } = await sendInvite(false);
      console.log('Invite API Response:', result);

      if (!response.ok && result?.errorCode === 'INVITATION_EXISTS' && result?.canReinvite) {
        const shouldReinvite = window.confirm('An invitation already exists for this email. Do you want to re-invite and send a fresh link?');
        if (!shouldReinvite) {
          return;
        }

        ({ response, result } = await sendInvite(true));
      }

      if (!response.ok) {
        if (result?.errorCode === 'STUDENT_EMAIL_CONFLICT') {
          alert('This email is already used by a student. Please use another email.');
          return;
        }

        if (result?.errorCode === 'ALREADY_TEACHER' || result?.errorCode === 'INVITATION_ALREADY_ACCEPTED') {
          alert('This email already belongs to a teacher.');
          return;
        }

        alert('Failed to send invitation: ' + (result?.error || 'Unknown error'));
        return;
      }

      if (result?.inviteType === 'resent') {
        alert('Teacher re-invitation sent successfully! A fresh invite link has been emailed.');
      } else {
        alert('Teacher invitation sent successfully! They will receive an email with a link to complete their profile.');
      }

      setShowInviteModal(false);
      setInvitationData({
        email: '',
        firstName: '',
        lastName: '',
        subject: '',
        gradeLevels: []
      });
      
      // Refresh teachers list
      refreshData('teachers');
      
    } catch (error) {
      console.error('Send invitation failed:', error);
      alert('Failed to send invitation: ' + error.message);
    }
  };

  const handleDeleteClassroom = async (classroomId, classroomName) => {
    if (!window.confirm(`Are you sure you want to delete the classroom "${classroomName}"? This action cannot be undone and will affect all enrolled students.`)) {
      return;
    }

    try {
      // First, delete all related pricing records
      const { error: pricingError } = await supabase
        .from('classroom_pricing')
        .delete()
        .eq('classroom_id', classroomId);

      if (pricingError) {
        console.error('Error deleting pricing:', pricingError);
        alert('Failed to delete classroom pricing: ' + pricingError.message);
        return;
      }

      // Delete the classroom (this will cascade to related enrollments due to foreign key constraints)
      const { error: classroomError } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroomId);

      if (classroomError) {
        console.error('Error deleting classroom:', classroomError);
        alert('Failed to delete classroom: ' + classroomError.message);
        return;
      }

      refreshData('classrooms');
      alert('Classroom deleted successfully!');
      
    } catch (error) {
      console.error('Delete classroom failed:', error);
      alert('Failed to delete classroom: ' + error.message);
    }
  };

  const handleNewClassroomChange = (e) => {
    const { name, value } = e.target;
    
    // If grade_level changed, auto-fill pricing from grade_subject_pricing table
    if (name === 'grade_level' && value) {
      const gradePricing = {
        '2': { monthly: 1400, quarterly: 3780, yearly: 13860 }, // Grades 2-4: 1400/mo
        '3': { monthly: 1400, quarterly: 3780, yearly: 13860 },
        '4': { monthly: 1400, quarterly: 3780, yearly: 13860 },
        '5': { monthly: 1500, quarterly: 4050, yearly: 15000 }, // Grades 5-6: 1500/mo
        '6': { monthly: 1500, quarterly: 4050, yearly: 15000 },
        '7': { monthly: 1600, quarterly: 4320, yearly: 16000 }, // Grades 7-8: 1600/mo
        '8': { monthly: 1600, quarterly: 4320, yearly: 16000 },
        '9': { monthly: 1800, quarterly: 4860, yearly: 18000 }, // Grades 9-10: 1800/mo
        '10': { monthly: 1800, quarterly: 4860, yearly: 18000 },
        '11': { monthly: 2500, quarterly: 6750, yearly: 25000 }, // Grades 11-12: 2500/mo
        '12': { monthly: 2500, quarterly: 6750, yearly: 25000 }
      };
      
      const pricing = gradePricing[value];
      if (pricing) {
        setNewClassroomData(prev => ({
          ...prev,
          [name]: value,
          monthly_price: pricing.monthly,
          quarterly_price: pricing.quarterly,
          yearly_price: pricing.yearly
        }));
        return;
      }
    }

    if (name === 'subject' && value !== 'other') {
      setNewClassroomData(prev => ({
        ...prev,
        subject: value,
        custom_subject: ''
      }));
      return;
    }

    if (name === 'board' && value !== 'other') {
      setNewClassroomData(prev => ({
        ...prev,
        board: value,
        custom_board: ''
      }));
      return;
    }
    
    setNewClassroomData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="w-full">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">Classrooms</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Classroom</span>
        </button>
      </div>
      {classrooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p>No classrooms found</p>
        </div>
      ) : (
        <>
          {/* Enhanced Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search classrooms, subjects, teachers, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select 
                  value={boardFilter} 
                  onChange={e => setBoardFilter(e.target.value)} 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                >
                  <option value="">All Boards</option>
                  {EDUCATION_BOARDS.map(board => (
                    <option key={board.value} value={board.value}>{board.label}</option>
                  ))}
                </select>
                
                <select 
                  value={gradeFilter} 
                  onChange={e => setGradeFilter(e.target.value)} 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                >
                  <option value="">All Grades</option>
                  {GRADE_LEVELS.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
                
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)} 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="null">Not Set</option>
                </select>
                
                {/* Clear Filters Button */}
                {(searchQuery || boardFilter || gradeFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setBoardFilter('');
                      setGradeFilter('');
                      setStatusFilter('');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredClassrooms.length} of {classrooms.length} classroom(s)
              {(searchQuery || boardFilter || gradeFilter || statusFilter) && (
                <span className="ml-2 text-blue-600">• Filters applied</span>
              )}
            </div>
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <style jsx>{`
              .line-clamp-3 {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
            `}</style>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm table-fixed">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200 min-w-[200px]">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5.5v3m0 0h-4.5M21 14H3" />
                        </svg>
                        Classroom Name
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200 min-w-[150px]">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5.5v3m0 0h-4.5M21 14H3" />
                        </svg>
                        Board & Grade
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Subject
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Teacher
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Students
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-800 border-b-2 border-gray-200">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClassrooms.map((cls) => (
                    <tr key={cls.id} className={`transition-all duration-200 border-b border-gray-100 ${
                      cls.is_active === false 
                        ? 'bg-gray-50 opacity-75 hover:bg-gray-100' 
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50'
                    }`}>
                      <td className={`px-4 py-4 font-semibold ${cls.is_active === false ? 'text-gray-500' : 'text-gray-900'}`}>
                        <div className="max-w-[200px] truncate" title={cls.name}>
                          {cls.name}
                        </div>
                      </td>
                      <td className={`px-4 py-4 ${cls.is_active === false ? 'text-gray-500' : 'text-gray-700'}`}>
                        {cls.board} - Grade {cls.grade_level}
                      </td>
                      <td className={`px-4 py-4 ${cls.is_active === false ? 'text-gray-500' : 'text-gray-700'}`}>
                        {cls.subject}
                      </td>
                      <td className={`px-4 py-4 ${cls.is_active === false ? 'text-gray-500' : 'text-gray-700'}`}>
                        {cls.teachers?.users?.first_name + ' ' + cls.teachers?.users?.last_name || 
                        <span className="text-gray-400 italic">No Teacher</span>}
                      </td>
                      <td className={`px-4 py-4 ${cls.is_active === false ? 'text-gray-500' : 'text-gray-700'}`}>
                        <div className="flex items-center">
                          <svg className={`w-4 h-4 mr-2 ${cls.is_active === false ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {cls.current_students || 0} / {cls.max_students || 30}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {cls.is_active === true && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {cls.is_active === false && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                        {cls.is_active === null && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Set
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(cls)} 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-1 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClassroom(cls.id, cls.name)} 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-1 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Classroom Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Classroom</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classroom Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newClassroomData.name}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Grade 10 Mathematics"
                    required
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    name="subject"
                    value={newClassroomData.subject}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {newClassroomData.subject === 'other' && (
                    <input
                      type="text"
                      name="custom_subject"
                      value={newClassroomData.custom_subject}
                      onChange={handleNewClassroomChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter subject name"
                      required
                    />
                  )}
                </div>

                {/* Board */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board *</label>
                  <select
                    name="board"
                    value={newClassroomData.board}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Board</option>
                    {EDUCATION_BOARDS.map(board => (
                      <option key={board.value} value={board.value}>{board.label}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                  {newClassroomData.board === 'other' && (
                    <input
                      type="text"
                      name="custom_board"
                      value={newClassroomData.custom_board}
                      onChange={handleNewClassroomChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter board name"
                      required
                    />
                  )}
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                  <select
                    name="grade_level"
                    value={newClassroomData.grade_level}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Grade</option>
                    {GRADE_LEVELS.map(grade => (
                      <option key={grade.value} value={grade.value}>{grade.label}</option>
                    ))}
                  </select>
                </div>

                {/* Max Students */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    name="max_students"
                    value={newClassroomData.max_students}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="100"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="is_active"
                    value={newClassroomData.is_active}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                    <option value="null">Not Set</option>
                  </select>
                </div>

                {/* Teacher (Optional for now) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher (Optional)</label>
                  <div className="flex gap-2">
                    <select
                      name="teacher_id"
                      value={newClassroomData.teacher_id}
                      onChange={handleNewClassroomChange}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Teacher Assigned</option>
                      {adminData.teachers?.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.users?.first_name} {teacher.users?.last_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleOpenInviteModal(newClassroomData)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                    >
                      + Invite New Teacher
                    </button>
                  </div>
                </div>

                {/* Monthly Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    name="monthly_price"
                    value={newClassroomData.monthly_price}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Quarterly Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarterly Price (₹)</label>
                  <input
                    type="number"
                    name="quarterly_price"
                    value={newClassroomData.quarterly_price}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2700"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Yearly Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    name="yearly_price"
                    value={newClassroomData.yearly_price}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={newClassroomData.description}
                    onChange={handleNewClassroomChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Brief description of the classroom content and objectives..."
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewClassroomData({
                      name: '',
                      subject: '',
                      custom_subject: '',
                      grade_level: '',
                      board: '',
                      custom_board: '',
                      description: '',
                      max_students: 30,
                      is_active: 'true',
                      teacher_id: '',
                      monthly_price: '',
                      quarterly_price: '',
                      yearly_price: ''
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClassroom}
                  disabled={
                    !newClassroomData.name ||
                    !newClassroomData.subject ||
                    !newClassroomData.board ||
                    !newClassroomData.grade_level ||
                    (newClassroomData.subject === 'other' && !newClassroomData.custom_subject.trim()) ||
                    (newClassroomData.board === 'other' && !newClassroomData.custom_board.trim())
                  }
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
                >
                  Create Classroom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Classroom</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editData.name || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classroom ID (Read-only)</label>
                  <input
                    type="text"
                    value={editData.id || ''}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editData.description || ''}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                  <select
                    name="board"
                    value={editData.board || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Board</option>
                    {EDUCATION_BOARDS.map(board => (
                      <option key={board.value} value={board.value}>
                        {board.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <select
                    name="grade_level"
                    value={editData.grade_level || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Grade</option>
                    {GRADE_LEVELS.map(grade => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    name="subject"
                    value={editData.subject || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity & Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Capacity & Assignment</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    name="max_students"
                    value={editData.max_students || ''}
                    onChange={handleEditChange}
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="is_active"
                    value={editData.is_active ?? ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                    <option value="null">Not Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <div className="flex gap-2">
                    <select
                      name="teacher_id"
                      value={editData.teacher_id || ''}
                      onChange={handleEditChange}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Teacher Assigned</option>
                      {adminData.teachers?.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.users?.first_name} {teacher.users?.last_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleOpenInviteModal(editData)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                    >
                      + Invite New
                    </button>
                  </div>
                </div>

                {/* Pricing */}
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">Pricing</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    name="monthly_price"
                    value={editData.monthly_price || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quarterly Price (₹)</label>
                  <input
                    type="number"
                    name="quarterly_price"
                    value={editData.quarterly_price || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price (₹)</label>
                  <input
                    type="number"
                    name="yearly_price"
                    value={editData.yearly_price || ''}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditId(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Teacher Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Teacher</h3>
              
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={invitationData.email}
                    onChange={handleInvitationChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={invitationData.firstName}
                    onChange={handleInvitationChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={invitationData.lastName}
                    onChange={handleInvitationChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                    required
                  />
                </div>

                {/* Subject (Pre-filled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={invitationData.subject}
                    onChange={handleInvitationChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Subject"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled from classroom</p>
                </div>

                {/* Grade Levels (Pre-filled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Levels</label>
                  <input
                    type="text"
                    value={invitationData.gradeLevels.join(', ') || 'None'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled from classroom</p>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInvitationData({
                      email: '',
                      firstName: '',
                      lastName: '',
                      subject: '',
                      gradeLevels: []
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitation}
                  disabled={!invitationData.email || !invitationData.firstName || !invitationData.lastName}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomList;
