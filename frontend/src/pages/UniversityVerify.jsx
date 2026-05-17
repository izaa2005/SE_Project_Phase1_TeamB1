import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { getAllOpportunities, getPendingOpportunities, verifyOpportunity } from '../services/university';

const UniversityVerify = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryStatus = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState(queryStatus === 'all' ? 'all' : 'pending');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewOpportunity, setReviewOpportunity] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSearchParams(statusFilter === 'all' ? { status: 'all' } : {});
  }, [statusFilter, setSearchParams]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = statusFilter === 'all'
          ? await getAllOpportunities({ page: 1, per_page: 100 })
          : await getPendingOpportunities({ page: 1, per_page: 100 });
        setOpportunities(data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load opportunities.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [statusFilter]);

  const pendingCount = useMemo(
    () => opportunities.filter((opp) => opp.status === 'pending' || statusFilter === 'pending').length,
    [opportunities, statusFilter]
  );

  const handleDecision = async (action) => {
    if (!reviewOpportunity) return;
    if (reviewOpportunity.status && reviewOpportunity.status !== 'pending') {
      alert('Only pending opportunities can be verified.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOpportunity(reviewOpportunity.id, action, reviewNotes);
      setOpportunities((prev) => prev.filter((opp) => opp.id !== reviewOpportunity.id));
      setReviewOpportunity(null);
      setReviewNotes('');
    } catch (err) {
      alert(typeof err === 'string' ? err : `Failed to ${action} opportunity.`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Title',
      render: (item) => <span className="font-medium">{item.title}</span>,
    },
    {
      key: 'company_name',
      title: 'Company',
      render: (item) => item.company_name || 'N/A',
    },
    {
      key: 'category',
      title: 'Category',
      render: (item) => <span className="capitalize">{item.category || 'N/A'}</span>,
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => <StatusBadge status={item.status || 'pending'} label={(item.status || 'pending').replace('_', ' ')} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <button className="btn-secondary text-sm" onClick={() => setReviewOpportunity(item)}>
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">Verify Opportunities</h1>
        <div className="flex gap-2">
          <button
            className={statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 text-sm text-gray-600">
          {statusFilter === 'pending'
            ? `${pendingCount} pending opportunities awaiting review.`
            : `Showing ${opportunities.length} total opportunities.`}
        </div>

        {loading ? (
          <div className="text-center py-10">Loading opportunities...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : (
          <DataTable
            columns={columns}
            data={opportunities}
            keyField="id"
            emptyMessage="No opportunities found."
          />
        )}
      </div>

      <Modal
        isOpen={!!reviewOpportunity}
        onClose={() => {
          if (submitting) return;
          setReviewOpportunity(null);
          setReviewNotes('');
        }}
        title={reviewOpportunity ? `Review: ${reviewOpportunity.title}` : 'Review Opportunity'}
        size="lg"
      >
        {reviewOpportunity && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Company</p>
                <p className="text-gray-900">{reviewOpportunity.company_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <StatusBadge status={reviewOpportunity.status || 'pending'} label={(reviewOpportunity.status || 'pending').replace('_', ' ')} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-gray-900 capitalize">{reviewOpportunity.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Deadline</p>
                <p className="text-gray-900">{reviewOpportunity.deadline ? new Date(reviewOpportunity.deadline).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
              <p className="text-gray-900 whitespace-pre-wrap">{reviewOpportunity.description || 'No description provided.'}</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1" htmlFor="reviewNotes">
                Verification Notes (optional)
              </label>
              <textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Add notes for the company..."
              />
            </div>

            <div className="flex gap-3">
              <button
                className="btn-primary"
                disabled={submitting || (reviewOpportunity.status && reviewOpportunity.status !== 'pending')}
                onClick={() => handleDecision('approve')}
              >
                {submitting ? 'Submitting...' : 'Approve'}
              </button>
              <button
                className="btn-secondary"
                disabled={submitting || (reviewOpportunity.status && reviewOpportunity.status !== 'pending')}
                onClick={() => handleDecision('reject')}
              >
                {submitting ? 'Submitting...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UniversityVerify;
