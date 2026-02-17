import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminStudents = () => {
  const { user, logout } = useAuth();
  const { adminData, refreshData } = useAdmin();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]);

  // Use cached data from AdminContext (instant loading!)
  const studentsData = useMemo(() => 
    adminData.studentsWithClassrooms || [],
    [adminData.studentsWithClassrooms]
  );

  const classrooms = useMemo(() => 
    adminData.classrooms?.filter(c => c.is_active) || [],
    [adminData.classrooms]
  );

  const loading = !adminData.studentsWithClassrooms || adminData.studentsWithClassrooms.length === 0;

  // Fetch payment plans only once on mount (lightweight data)
  useEffect(() => {
    let isMounted = true;

    const fetchPaymentPlans = async () => {
      const { data } = await supabase
        .from('payment_plans')
        .select('id, name, billing_cycle')
        .eq('is_active', true);
      if (isMounted) setPaymentPlans(data || []);
    };

    if (paymentPlans.length === 0) {
      fetchPaymentPlans();
    }

    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const updateStudentStatus = async (studentId, newStatus) => {
    if (!window.confirm(`Are you sure you want to set this student to ${newStatus}? ${newStatus === 'inactive' ? 'This will remove them from all classrooms.' : ''}`)) {
      return;
    }
    
    const { error } = await supabase.rpc('admin_update_student_status', {
      p_student_id: studentId,
      p_status: newStatus
    });
    
    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update student status');
    } else {
      alert('Student status updated successfully');
      await refreshData(); // Refresh all data (affects classrooms counts)
    }
  };

  const removeFromClassroom = async (studentId, classroomId) => {
    if (!window.confirm('Remove this student from the classroom?')) return;
    
    const { data, error } = await supabase.rpc('admin_remove_student_from_classroom', {
      p_student_id: studentId,
      p_classroom_id: classroomId
    });
    
    if (error) {
      console.error('Error:', error);
      alert('Failed to remove student from classroom');
    } else if (data.success) {
      alert(data.message);
      await refreshData(); // Refresh all data (affects classrooms counts)
    } else {
      alert(data.error);
    }
  };

  const reactivateEnrollment = async (studentId, classroomId) => {
    if (!window.confirm('Reactivate this student enrollment?')) return;
    
    const { data, error } = await supabase.rpc('admin_reactivate_student_enrollment', {
      p_student_id: studentId,
      p_classroom_id: classroomId
    });
    
    if (error) {
      console.error('Error:', error);
      alert('Failed to reactivate enrollment');
    } else if (data.success) {
      alert(data.message);
      await refreshData(); // Refresh all data (affects classrooms counts)
    } else {
      alert(data.error);
    }
  };

  const deleteStudentAccount = async (student) => {
    const confirmMessage = `⚠️ PERMANENT DELETION WARNING ⚠️\n\nYou are about to permanently delete:\n\nStudent: ${student.student_name}\nEmail: ${student.email}\nID: ${student.student_identifier}\n\nThis will remove:\n- All enrollments\n- All payment records\n- All attendance records\n- All assignment attempts\n- All progress data\n- The user account from authentication\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;
    
    const userInput = window.prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }
    
    const { data, error } = await supabase.rpc('admin_delete_student_account', {
      p_student_id: student.student_id
    });
    
    if (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student account: ' + error.message);
    } else if (data.success) {
      alert(`✅ ${data.message}\n\nDeleted: ${data.deleted_student.name} (${data.deleted_student.email})`);
      await refreshData();
    } else {
      alert('Failed to delete: ' + data.error);
    }
  };

  const openEnrollModal = (student) => {
    setSelectedStudent(student);
    setShowEnrollModal(true);
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const classroomId = formData.get('classroom_id');
    const paymentPlanId = formData.get('payment_plan_id');
    
    const { data, error } = await supabase.rpc('admin_enroll_student_in_classroom', {
      p_student_id: selectedStudent.student_id,
      p_classroom_id: classroomId,
      p_payment_plan_id: paymentPlanId
    });
    
    if (error) {
      alert('Failed to enroll student');
    } else if (data.success) {
      alert(data.message);
      setShowEnrollModal(false);
      await refreshData(); // Refresh all data (affects classrooms counts)
    } else {
      alert(data.error);
    }
  };

  // Filter students based on search, grade, and board
  const filteredStudents = studentsData.filter(student => {
    const fullName = student.student_name?.toLowerCase() || '';
    const email = student.email?.toLowerCase() || '';
    const searchMatch = searchTerm === '' || 
      fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      student.student_identifier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const gradeMatch = gradeFilter === '' || 
      String(student.grade_level) === String(gradeFilter);
    
    const boardMatch = boardFilter === '' || 
      student.board === boardFilter;
    
    const statusMatch = statusFilter === '' || 
      student.student_status === statusFilter;
    
    return searchMatch && gradeMatch && boardMatch && statusMatch;
  });

  // Count students by status
  const activeCount = studentsData.filter(s => s.student_status === 'active').length;
  const inactiveCount = studentsData.filter(s => s.student_status === 'inactive').length;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/'; // Redirect to main website
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
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
                className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium text-sm"
              >
                Teachers
              </button>
              <button
                onClick={() => navigate('/students')}
                className="border-b-2 border-blue-500 text-blue-600 px-3 py-2 font-medium text-sm"
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
              <h2 className="text-2xl font-semibold mb-4">Manage Students</h2>
              
              {/* Search and Filters */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 flex-1"
                />
                
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Grades</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                </select>

                <select
                  value={boardFilter}
                  onChange={(e) => setBoardFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Boards</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="IGCSE">IGCSE</option>
                </select>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive ({inactiveCount})
                </button>
                <button
                  onClick={() => setStatusFilter('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === ''
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">Loading students...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade/Board
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Classrooms
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.student_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.student_identifier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-xs text-gray-500">{student.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>Grade {student.grade_level || '-'}</div>
                            <div className="text-xs">{student.board || '-'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {student.school_name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              student.student_status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.student_status}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {student.active_enrollments}/{student.total_enrollments} active
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {student.classrooms && student.classrooms.length > 0 ? (
                              <div className="space-y-2">
                                {student.classrooms.map((classroom, idx) => (
                                  <div key={idx} className="flex items-center justify-between space-x-2 bg-gray-50 p-2 rounded">
                                    <div>
                                      <div className="font-medium">{classroom.classroom_name}</div>
                                      <div className="text-xs text-gray-400">({classroom.subject})</div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 text-xs rounded ${
                                        classroom.enrollment_status === 'active' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {classroom.enrollment_status === 'cancelled' ? 'inactive' : classroom.enrollment_status}
                                      </span>
                                      {classroom.enrollment_status === 'active' ? (
                                        <button
                                          onClick={() => removeFromClassroom(student.student_id, classroom.classroom_id)}
                                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs"
                                        >
                                          Remove
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => reactivateEnrollment(student.student_id, classroom.classroom_id)}
                                          className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs"
                                        >
                                          Reactivate
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No enrollments</span>
                            )}
                            <button
                              onClick={() => openEnrollModal(student)}
                              className="mt-2 w-full px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs"
                            >
                              + Enroll in Classroom
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={student.student_status}
                              onChange={(e) => updateStudentStatus(student.student_id, e.target.value)}
                              className={`px-3 py-1 rounded text-xs font-medium border ${
                                student.student_status === 'active'
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'bg-red-50 text-red-700 border-red-300'
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => deleteStudentAccount(student)}
                              className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 rounded text-xs font-medium transition-colors"
                              title="Permanently delete this student account"
                            >
                              🗑️ Delete Account
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Enroll Student in Classroom</h3>
            <p className="text-gray-600 mb-4">
              Student: <strong>{selectedStudent?.student_name}</strong>
            </p>
            <form onSubmit={handleEnrollStudent}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Classroom</label>
                <select
                  name="classroom_id"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a classroom...</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} - {classroom.subject} (Grade {classroom.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Payment Plan</label>
                <select
                  name="payment_plan_id"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a plan...</option>
                  {paymentPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.billing_cycle})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Enroll
                </button>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
