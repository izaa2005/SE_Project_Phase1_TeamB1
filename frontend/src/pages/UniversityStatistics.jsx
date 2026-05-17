import React, { useEffect, useMemo, useState } from 'react';
import { getUniversityStatistics } from '../services/university';

const UniversityStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUniversityStatistics();
        setStats(data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalOpportunities = useMemo(() => {
    const byStatus = stats?.opportunities_by_status || {};
    return Object.values(byStatus).reduce((sum, count) => sum + count, 0);
  }, [stats]);

  const downloadReport = () => {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `university-statistics-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  const byStatus = stats?.opportunities_by_status || {};
  const byRole = stats?.users_by_role || {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-gray-900">University Statistics</h1>
        <button className="btn-primary" onClick={downloadReport}>
          Download JSON Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total Opportunities</h3>
          <p className="text-4xl font-bold text-primary-600 mt-2">{totalOpportunities}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Recent Verifications (7d)</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats?.recent_verifications || 0}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-700">Total Applications</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{stats?.total_applications || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Opportunity Status</h2>
          <ul className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between border-b border-gray-100 py-2">
                <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Users By Role</h2>
          <ul className="space-y-2">
            {Object.entries(byRole).map(([role, count]) => (
              <li key={role} className="flex justify-between border-b border-gray-100 py-2">
                <span className="capitalize text-gray-700">{role}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {stats?.recent_activity?.length ? (
          <ul className="space-y-3">
            {stats.recent_activity.map((log, idx) => (
              <li key={`${log.table_name}-${log.record_id}-${idx}`} className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-600">{log.table_name} #{log.record_id} · user {log.user_id || 'system'}</p>
                </div>
                <span className="text-sm text-gray-500">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent activity found.</p>
        )}
      </div>
    </div>
  );
};

export default UniversityStatistics;
