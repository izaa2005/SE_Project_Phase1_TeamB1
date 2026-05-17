import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorDisplay from '../components/ErrorDisplay'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import {
  getUsers,
  updateUser,
  toggleUser,
  getAllOpportunitiesAdmin,
  adminUpdateOpportunity,
  adminDeleteOpportunity,
  getAdminDashboardStats,
  getSystemAlerts,
} from '../services/admin'

const TAB_BY_PATH = {
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/opportunities': 'opportunities',
}

const DEFAULT_OPPORTUNITY_FORM = {
  title: '',
  description: '',
  category: 'internship',
  type: 'full-time',
  location: '',
  deadline: '',
  application_link: '',
  status: 'pending',
}

const AdminDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')

  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOpportunities: 0,
    pendingActions: 0,
    userDistribution: {},
    opportunityStatus: {},
    totalApplications: 0,
    recentPendingOpportunities: 0,
    lastVerification: null,
  })
  const [activity, setActivity] = useState([])

  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState(null)
  const [users, setUsers] = useState([])
  const [userPage, setUserPage] = useState(1)
  const [userPages, setUserPages] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
  })

  const [oppsLoading, setOppsLoading] = useState(true)
  const [oppsError, setOppsError] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [oppPage, setOppPage] = useState(1)
  const [oppPages, setOppPages] = useState(1)
  const [oppTotal, setOppTotal] = useState(0)
  const [oppFilters, setOppFilters] = useState({
    status: '',
    category: '',
    type: '',
  })

  const [editingOpportunity, setEditingOpportunity] = useState(null)
  const [opportunityForm, setOpportunityForm] = useState(DEFAULT_OPPORTUNITY_FORM)
  const [savingOpportunity, setSavingOpportunity] = useState(false)

  useEffect(() => {
    setActiveTab(TAB_BY_PATH[location.pathname] || 'dashboard')
  }, [location.pathname])

  const loadDashboard = async () => {
    setDashboardLoading(true)
    setDashboardError(null)
    try {
      const [dashboardStats, systemActivity] = await Promise.all([
        getAdminDashboardStats(),
        getSystemAlerts(),
      ])
      setStats(dashboardStats)
      setActivity(systemActivity)
    } catch (error) {
      setDashboardError(error?.response?.data?.error || 'Failed to load dashboard statistics')
    } finally {
      setDashboardLoading(false)
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const response = await getUsers({
        page: userPage,
        per_page: 10,
        search: userFilters.search || undefined,
        role: userFilters.role || undefined,
        status: userFilters.status || undefined,
      })
      setUsers(response.users || [])
      setUserTotal(response.total || 0)
      setUserPages(response.pages || 1)
    } catch (error) {
      setUsersError(error?.response?.data?.error || 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  const loadOpportunities = async () => {
    setOppsLoading(true)
    setOppsError(null)
    try {
      const response = await getAllOpportunitiesAdmin({
        page: oppPage,
        per_page: 10,
        status: oppFilters.status || undefined,
        category: oppFilters.category || undefined,
        type: oppFilters.type || undefined,
      })
      setOpportunities(response.opportunities || [])
      setOppTotal(response.total || 0)
      setOppPages(response.pages || 1)
    } catch (error) {
      setOppsError(error?.response?.data?.error || 'Failed to load opportunities')
    } finally {
      setOppsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab, userPage, userFilters.search, userFilters.role, userFilters.status])

  useEffect(() => {
    if (activeTab === 'opportunities') {
      loadOpportunities()
    }
  }, [activeTab, oppPage, oppFilters.status, oppFilters.category, oppFilters.type])

  const handleTabChange = (tab) => {
    if (tab === 'dashboard') navigate('/admin')
    if (tab === 'users') navigate('/admin/users')
    if (tab === 'opportunities') navigate('/admin/opportunities')
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole })
      await loadUsers()
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to update user role')
    }
  }

  const handleToggleUser = async (userId) => {
    try {
      await toggleUser(userId)
      await loadUsers()
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to toggle user account')
    }
  }

  const handleModerateOpportunity = async (opportunityId, status) => {
    try {
      await adminUpdateOpportunity(opportunityId, { status })
      await loadOpportunities()
      if (activeTab === 'dashboard') {
        await loadDashboard()
      }
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to update opportunity status')
    }
  }

  const handleDeleteOpportunity = async (opportunityId) => {
    if (!window.confirm('Delete this opportunity permanently?')) return

    try {
      await adminDeleteOpportunity(opportunityId)
      await loadOpportunities()
      if (activeTab === 'dashboard') {
        await loadDashboard()
      }
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to delete opportunity')
    }
  }

  const openEditOpportunity = (opportunity) => {
    setEditingOpportunity(opportunity)
    setOpportunityForm({
      title: opportunity.title || '',
      description: opportunity.description || '',
      category: opportunity.category || 'internship',
      type: opportunity.type || 'full-time',
      location: opportunity.location || '',
      deadline: opportunity.deadline ? opportunity.deadline.slice(0, 10) : '',
      application_link: opportunity.application_link || '',
      status: opportunity.status || 'pending',
    })
  }

  const submitOpportunityEdit = async (event) => {
    event.preventDefault()
    if (!editingOpportunity) return

    setSavingOpportunity(true)
    try {
      await adminUpdateOpportunity(editingOpportunity.id, opportunityForm)
      setEditingOpportunity(null)
      setOpportunityForm(DEFAULT_OPPORTUNITY_FORM)
      await loadOpportunities()
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to update opportunity')
    } finally {
      setSavingOpportunity(false)
    }
  }

  const dashboardCards = useMemo(() => ([
    { label: 'Total Users', value: stats.totalUsers, color: 'text-primary-600' },
    { label: 'Active Users', value: stats.activeUsers, color: 'text-green-600' },
    { label: 'Opportunities', value: stats.totalOpportunities, color: 'text-blue-600' },
    { label: 'Pending Actions', value: stats.pendingActions, color: 'text-yellow-600' },
  ]), [stats])

  const usersColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (user) => <span className="font-medium text-gray-900">{user.name}</span>,
    },
    { key: 'email', title: 'Email' },
    {
      key: 'role',
      title: 'Role',
      render: (user) => (
        <select
          value={user.role}
          onChange={(event) => handleRoleChange(user.id, event.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="student">Student</option>
          <option value="company">Company</option>
          <option value="university">University</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (user) => <StatusBadge status={user.status} label={user.status} />,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (user) => (
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => handleToggleUser(user.id)}
        >
          {user.is_active ? 'Disable' : 'Enable'}
        </button>
      ),
    },
  ]

  const opportunitiesColumns = [
    {
      key: 'title',
      title: 'Title',
      render: (opportunity) => <span className="font-medium text-gray-900">{opportunity.title}</span>,
    },
    {
      key: 'company_name',
      title: 'Company',
      render: (opportunity) => opportunity.company_name || 'N/A',
    },
    {
      key: 'status',
      title: 'Status',
      render: (opportunity) => <StatusBadge status={opportunity.status} label={opportunity.status} />, 
    },
    {
      key: 'deadline',
      title: 'Deadline',
      render: (opportunity) => (
        <span>{opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : 'N/A'}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (opportunity) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => openEditOpportunity(opportunity)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => handleModerateOpportunity(opportunity.id, 'approved')}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => handleModerateOpportunity(opportunity.id, 'rejected')}
          >
            Reject
          </button>
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-800"
            onClick={() => handleDeleteOpportunity(opportunity.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900">Administrator Panel</h1>
          <p className="text-sm text-gray-500">Platform-wide management and moderation</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleTabChange('users')}
          >
            Users
          </button>
          <button
            type="button"
            className={activeTab === 'opportunities' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => handleTabChange('opportunities')}
          >
            Opportunities
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        dashboardLoading ? (
          <LoadingSpinner />
        ) : dashboardError ? (
          <ErrorDisplay message={dashboardError} onRetry={loadDashboard} />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dashboardCards.map((card) => (
                <div key={card.label} className="card text-center">
                  <h3 className="text-lg font-semibold text-gray-700">{card.label}</h3>
                  <p className={`text-4xl font-bold mt-2 ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Distribution</h2>
                <ul className="space-y-2">
                  {Object.entries(stats.userDistribution || {}).map(([role, count]) => (
                    <li key={role} className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="capitalize text-gray-700">{role}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Opportunity Status</h2>
                <ul className="space-y-2">
                  {Object.entries(stats.opportunityStatus || {}).map(([status, count]) => (
                    <li key={status} className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="capitalize text-gray-700">{status}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">System Activity</h2>
              {activity.length === 0 ? (
                <p className="text-gray-500">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((log) => (
                    <div key={log.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-xs text-gray-500">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.table_name} #{log.record_id} by user {log.user_id || 'system'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      ) : null}

      {activeTab === 'users' ? (
        <div className="card space-y-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={userFilters.search}
                onChange={(event) => {
                  setUserPage(1)
                  setUserFilters((previous) => ({ ...previous, search: event.target.value }))
                }}
                placeholder="Name or email"
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={userFilters.role}
                onChange={(event) => {
                  setUserPage(1)
                  setUserFilters((previous) => ({ ...previous, role: event.target.value }))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All roles</option>
                <option value="student">Student</option>
                <option value="company">Company</option>
                <option value="university">University</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={userFilters.status}
                onChange={(event) => {
                  setUserPage(1)
                  setUserFilters((previous) => ({ ...previous, status: event.target.value }))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setUserPage(1)
                setUserFilters({ search: '', role: '', status: '' })
              }}
            >
              Reset
            </button>
          </div>

          {usersLoading ? (
            <LoadingSpinner />
          ) : usersError ? (
            <ErrorDisplay message={usersError} onRetry={loadUsers} />
          ) : (
            <>
              <div className="text-sm text-gray-600">{userTotal} total users</div>
              <DataTable columns={usersColumns} data={users} keyField="id" emptyMessage="No users found." />
              <Pagination currentPage={userPage} totalPages={userPages} onPageChange={setUserPage} />
            </>
          )}
        </div>
      ) : null}

      {activeTab === 'opportunities' ? (
        <div className="card space-y-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={oppFilters.status}
                onChange={(event) => {
                  setOppPage(1)
                  setOppFilters((previous) => ({ ...previous, status: event.target.value }))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={oppFilters.category}
                onChange={(event) => {
                  setOppPage(1)
                  setOppFilters((previous) => ({ ...previous, category: event.target.value }))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All categories</option>
                <option value="internship">Internship</option>
                <option value="workshop">Workshop</option>
                <option value="competition">Competition</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={oppFilters.type}
                onChange={(event) => {
                  setOppPage(1)
                  setOppFilters((previous) => ({ ...previous, type: event.target.value }))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">All types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setOppPage(1)
                setOppFilters({ status: '', category: '', type: '' })
              }}
            >
              Reset
            </button>
          </div>

          {oppsLoading ? (
            <LoadingSpinner />
          ) : oppsError ? (
            <ErrorDisplay message={oppsError} onRetry={loadOpportunities} />
          ) : (
            <>
              <div className="text-sm text-gray-600">{oppTotal} total opportunities</div>
              <DataTable
                columns={opportunitiesColumns}
                data={opportunities}
                keyField="id"
                emptyMessage="No opportunities found."
              />
              <Pagination currentPage={oppPage} totalPages={oppPages} onPageChange={setOppPage} />
            </>
          )}
        </div>
      ) : null}

      <Modal
        isOpen={!!editingOpportunity}
        onClose={() => setEditingOpportunity(null)}
        title={editingOpportunity ? `Edit Opportunity: ${editingOpportunity.title}` : 'Edit Opportunity'}
        size="lg"
      >
        <form onSubmit={submitOpportunityEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={opportunityForm.title}
              onChange={(event) => setOpportunityForm((previous) => ({ ...previous, title: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={opportunityForm.description}
              onChange={(event) => setOpportunityForm((previous) => ({ ...previous, description: event.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={opportunityForm.category}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, category: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="internship">Internship</option>
                <option value="workshop">Workshop</option>
                <option value="competition">Competition</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={opportunityForm.type}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, type: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={opportunityForm.location}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, location: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={opportunityForm.deadline}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, deadline: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
              <input
                type="url"
                value={opportunityForm.application_link}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, application_link: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={opportunityForm.status}
                onChange={(event) => setOpportunityForm((previous) => ({ ...previous, status: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setEditingOpportunity(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={savingOpportunity}>
              {savingOpportunity ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminDashboard
