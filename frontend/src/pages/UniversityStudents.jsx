import React, { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import {
  getPendingStudents,
  getApprovedStudents,
  approveStudent,
  rejectStudent,
} from '../services/university';

const UniversityStudents = () => {
  const [tab, setTab] = useState('pending');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async (targetTab = tab, targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = targetTab === 'pending'
        ? await getPendingStudents({ page: targetPage, per_page: 10 })
        : await getApprovedStudents({ page: targetPage, per_page: 10 });

      setStudents(response.students || []);
      setPage(response.page || 1);
      setPages(response.pages || 1);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(tab, 1);
  }, [tab]);

  const handleApprove = async (studentId) => {
    setActionLoading(true);
    try {
      await approveStudent(studentId);
      await fetchStudents('pending', page);
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to approve student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await rejectStudent(selectedStudent.id, rejectReason || undefined);
      setSelectedStudent(null);
      setRejectReason('');
      await fetchStudents('pending', page);
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to reject student.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'email',
      title: 'Email',
    },
    {
      key: 'is_verified',
      title: 'Email Verified',
      render: (item) => (
        <span className={item.is_verified ? 'text-green-700 font-medium' : 'text-yellow-700 font-medium'}>
          {item.is_verified ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Registered',
      render: (item) => (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <div className="space-x-2">
          <button
            className="btn-primary text-sm"
            disabled={actionLoading}
            onClick={() => handleApprove(item.id)}
          >
            Approve
          </button>
          <button
            className="btn-secondary text-sm"
            disabled={actionLoading}
            onClick={() => setSelectedStudent(item)}
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  const approvedColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'email',
      title: 'Email',
    },
    {
      key: 'is_verified',
      title: 'Email Verified',
      render: (item) => (
        <span className={item.is_verified ? 'text-green-700 font-medium' : 'text-yellow-700 font-medium'}>
          {item.is_verified ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Approved Onboard',
      render: (item) => (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Student Approvals</h1>

      <div className="flex gap-3">
        <button
          className={tab === 'pending' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('pending')}
        >
          Pending Students
        </button>
        <button
          className={tab === 'approved' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('approved')}
        >
          Approved Students
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="py-10 text-center">Loading students...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : (
          <>
            <DataTable
              columns={tab === 'pending' ? pendingColumns : approvedColumns}
              data={students}
              keyField="id"
              emptyMessage={tab === 'pending' ? 'No pending students found.' : 'No approved students found.'}
            />
            <Pagination currentPage={page} totalPages={pages} onPageChange={(newPage) => fetchStudents(tab, newPage)} />
          </>
        )}
      </div>

      <Modal
        isOpen={!!selectedStudent}
        onClose={() => {
          if (!actionLoading) {
            setSelectedStudent(null);
            setRejectReason('');
          }
        }}
        title={selectedStudent ? `Reject ${selectedStudent.name}` : 'Reject Student'}
      >
        {selectedStudent && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Provide an optional reason for rejecting <span className="font-semibold">{selectedStudent.email}</span>.
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3">
              <button className="btn-secondary" disabled={actionLoading} onClick={() => setSelectedStudent(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={actionLoading} onClick={handleRejectSubmit}>
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UniversityStudents;
