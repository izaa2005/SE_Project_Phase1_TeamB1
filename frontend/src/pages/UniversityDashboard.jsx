import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  getPendingOpportunities,
  verifyOpportunity,
  getUniversityDashboardStats,
  getRecentActivity,
} from '../services/university';

/**
 * UniversityDashboard - enhanced with pending opportunities, verification, and statistics.
 * 
 * Uses reusable DataTable and StatusBadge components. Implements responsive grid for stats cards.
 * Real-time verification actions with feedback. Recent activity panel with timeline styling.
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

const UniversityDashboard = () => {
  const navigate = useNavigate();
  // State for pending opportunities
  const [pendingOpportunities, setPendingOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewOpportunity, setReviewOpportunity] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    pendingVerification: 0,
    totalOpportunities: 0,
    verifiedThisMonth: 0,
    rejectionRate: '0%',
  });

  // Recent activity
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pending, statistics, activity] = await Promise.all([
        getPendingOpportunities(),
        getUniversityDashboardStats(),
        getRecentActivity(),
      ]);
      setPendingOpportunities(pending);
      setStats(statistics);
      setRecentActivity(activity);
    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle verification (approve/reject)
  const handleVerification = async (opportunityId, action) => {
    const confirmMessage = action === 'approve'
      ? 'Are you sure you want to approve this opportunity?'
      : 'Are you sure you want to reject this opportunity?';
    if (!window.confirm(confirmMessage)) return;

    try {
      await verifyOpportunity(opportunityId, action);
      // Remove from pending list
      setPendingOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      // Update stats locally (in a real app we would refetch)
      setStats(prev => ({
        ...prev,
        pendingVerification: prev.pendingVerification - 1,
        verifiedThisMonth: action === 'approve' ? prev.verifiedThisMonth + 1 : prev.verifiedThisMonth,
      }));
      // Add to recent activity (simulate)
      const opp = pendingOpportunities.find(o => o.id === opportunityId);
      const newActivity = {
        id: Date.now(),
        type: action,
        message: `${action === 'approve' ? 'Approved' : 'Rejected'} "${opp?.title}" from ${opp?.company_name || 'Unknown company'}`,
        timestamp: new Date().toISOString(),
      };
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
      if (reviewOpportunity?.id === opportunityId) {
        setReviewOpportunity(null);
      }
    } catch (err) {
      alert(`Failed to ${action} opportunity.`);
    }
  };

  // Table columns for pending opportunities
  const pendingColumns = [
    {
      key: 'title',
      title: 'Title',
      render: (item) => <span className="font-medium">{item.title}</span>,
    },
    {
      key: 'company_name',
      title: 'Company',
    },
    {
      key: 'created_at',
      title: 'Submitted',
      render: (item) => (
        item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : 'N/A'
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (item) => <StatusBadge status={item.type} customColors={{ bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' }} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <div className="space-x-2">
          <button
            className="btn-primary text-sm"
            onClick={() => handleVerification(item.id, 'approve')}
          >
            Approve
          </button>
          <button
            className="btn-secondary text-sm"
            onClick={() => handleVerification(item.id, 'reject')}
          >
            Reject
          </button>
          <button
            className="text-gray-600 hover:text-gray-800 text-sm"
            onClick={() => setReviewOpportunity(item)}
          >
            Review
          </button>
        </div>
      ),
    },
  ];

  // Activity icon mapping
  const getActivityIcon = (type) => {
    switch (type) {
      case 'approve': return <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>;
      case 'reject': return <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>;
      default: return <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-white px-6 py-5 shadow-md">
        <h1 className="text-3xl font-bold text-gray-900">University Staff Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Pending Verification</h3>
          <p className="text-4xl font-bold text-yellow-600 mt-2">{stats.pendingVerification}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total Opportunities</h3>
          <p className="text-4xl font-bold text-primary-600 mt-2">{stats.totalOpportunities}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Verified This Month</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats.verifiedThisMonth}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Rejection Rate</h3>
          <p className="text-4xl font-bold text-red-600 mt-2">{stats.rejectionRate}</p>
        </div>
      </div>

      {/* Pending Verification Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Verification</h2>
        {loading ? (
          <div className="text-center py-12">Loading pending opportunities...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : (
          <>
            <DataTable
              columns={pendingColumns}
              data={pendingOpportunities}
              keyField="id"
              emptyMessage="No pending opportunities for verification."
            />
            <div className="mt-6 text-center">
              <button className="btn-primary" onClick={() => navigate('/university/verify')}>
                View All Pending
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary" onClick={() => navigate('/university/verify')}>
              Verify Opportunities
            </button>
            <button className="btn-secondary" onClick={() => navigate('/university/students')}>
              Approve Students
            </button>
            <button className="btn-secondary" onClick={() => navigate('/university/verify?status=all')}>
              View All Opportunities
            </button>
            <button className="btn-secondary" onClick={() => navigate('/university/statistics')}>
              Generate Report
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                const emailList = [...new Set(
                  pendingOpportunities
                    .map((opp) => opp.company_email)
                    .filter(Boolean)
                )];
                if (!emailList.length) {
                  alert('No company emails found for pending opportunities.');
                  return;
                }
                window.location.href = `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent('InternLink Opportunity Verification Update')}`;
              }}
            >
              Contact Companies
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-center">
                  {getActivityIcon(activity.type)}
                  <div>
                    <span>{activity.message}</span>
                    <div className="text-xs text-gray-500">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No recent activity.</li>
            )}
          </ul>
        </div>
      </div>

      <Modal
        isOpen={!!reviewOpportunity}
        onClose={() => setReviewOpportunity(null)}
        title={reviewOpportunity ? `Review: ${reviewOpportunity.title}` : 'Review Opportunity'}
        size="lg"
      >
        {reviewOpportunity && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Company</h3>
              <p className="text-gray-900">{reviewOpportunity.company_name || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Category</h3>
                <p className="text-gray-900 capitalize">{reviewOpportunity.category || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Type</h3>
                <p className="text-gray-900 capitalize">{reviewOpportunity.type || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Location</h3>
                <p className="text-gray-900">{reviewOpportunity.location || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Deadline</h3>
                <p className="text-gray-900">
                  {reviewOpportunity.deadline ? new Date(reviewOpportunity.deadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{reviewOpportunity.description || 'No description provided.'}</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary" onClick={() => handleVerification(reviewOpportunity.id, 'approve')}>
                Approve
              </button>
              <button className="btn-secondary" onClick={() => handleVerification(reviewOpportunity.id, 'reject')}>
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UniversityDashboard;