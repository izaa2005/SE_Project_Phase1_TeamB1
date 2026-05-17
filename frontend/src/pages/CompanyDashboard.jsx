import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import {
  getCompanyOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityApplications,
  downloadApplicationFile,
  updateApplicationStatus,
} from '../services/company'

const CompanyDashboard = () => {
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applications, setApplications] = useState([])
  const [activeOpportunityId, setActiveOpportunityId] = useState(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'internship',
    type: 'full-time',
    location: '',
    deadline: '',
  })

  useEffect(() => {
    loadOpportunities()
  }, [])

  const loadOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getCompanyOpportunities()
      setOpportunities(items)
    } catch (err) {
      setError('Failed to load opportunities.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'internship',
      type: 'full-time',
      location: '',
      deadline: '',
    })
    setSelectedOpportunity(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const openEditModal = (opportunity) => {
    setSelectedOpportunity(opportunity)
    setFormData({
      title: opportunity.title || '',
      description: opportunity.description || '',
      category: opportunity.category || 'internship',
      type: opportunity.type || 'full-time',
      location: opportunity.location || '',
      deadline: opportunity.deadline ? opportunity.deadline.slice(0, 10) : '',
    })
    setIsEditModalOpen(true)
  }

  const handleCreateSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await createOpportunity(formData)
      setIsCreateModalOpen(false)
      resetForm()
      await loadOpportunities()
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to create opportunity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    if (!selectedOpportunity) {
      return
    }

    setIsSubmitting(true)
    try {
      await updateOpportunity(selectedOpportunity.id, formData)
      setIsEditModalOpen(false)
      resetForm()
      await loadOpportunities()
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to update opportunity.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (opportunityId) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) {
      return
    }

    try {
      await deleteOpportunity(opportunityId)
      await loadOpportunities()
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to delete opportunity.')
    }
  }

  const handleViewApplications = async (opportunityId) => {
    try {
      setActiveOpportunityId(opportunityId)
      const items = await getOpportunityApplications(opportunityId)
      setApplications(items)
      setIsApplicationsModalOpen(true)
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to load applications.')
    }
  }

  const handleDownloadFile = async (applicationId, fileKind, fileIndex, fileName) => {
    try {
      await downloadApplicationFile(applicationId, fileKind, fileIndex, fileName)
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to download file.')
    }
  }

  const handleApplicationDecision = async (opportunityId, applicationId, status) => {
    if (!opportunityId) {
      alert('Select an opportunity before reviewing applications.')
      return
    }

    try {
      await updateApplicationStatus(opportunityId, applicationId, status)
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? { ...application, status: status === 'approved' ? 'accepted' : 'rejected' }
            : application
        )
      )
      await loadOpportunities()
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to update application status.')
    }
  }

  const formatApplicationStatus = (status) => {
    switch (status) {
      case 'submitted':
        return 'pending'
      case 'under_review':
        return 'under review'
      case 'accepted':
        return 'approved'
      case 'rejected':
        return 'denied'
      default:
        return status
    }
  }

  const getApplicationBadgeStatus = (status) => {
    switch (status) {
      case 'accepted':
        return 'approved'
      case 'rejected':
        return 'rejected'
      case 'under_review':
        return 'pending'
      case 'submitted':
      default:
        return 'pending'
    }
  }

  const columns = [
    {
      key: 'title',
      title: 'Title',
      render: (item) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    {
      key: 'created_at',
      title: 'Posted',
      render: (item) => (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'applications_count',
      title: 'Applications',
      render: (item) => (
        <button
          type="button"
          className="text-primary-700 hover:text-primary-900 underline"
          onClick={() => handleViewApplications(item.id)}
        >
          {item.applications_count || 0}
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-sm" onClick={() => openEditModal(item)}>
            Edit
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => handleViewApplications(item.id)}>
            View Apps
          </button>
          <button type="button" className="text-sm text-red-600 hover:text-red-800" onClick={() => handleDelete(item.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  const renderForm = (onSubmit) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(event) => setFormData({ ...formData, title: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(event) => setFormData({ ...formData, description: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category}
            onChange={(event) => setFormData({ ...formData, category: event.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="internship">Internship</option>
            <option value="workshop">Workshop</option>
            <option value="competition">Competition</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={formData.type}
            onChange={(event) => setFormData({ ...formData, type: event.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          type="text"
          required
          value={formData.location}
          onChange={(event) => setFormData({ ...formData, location: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Deadline</label>
        <input
          type="date"
          required
          value={formData.deadline}
          onChange={(event) => setFormData({ ...formData, deadline: event.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
            resetForm()
          }}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : selectedOpportunity ? 'Update Opportunity' : 'Create Opportunity'}
        </button>
      </div>
    </form>
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage listings and review applications.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Post New Opportunity
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-500">Total Listings</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{opportunities.length}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {opportunities.filter((item) => item.status === 'approved').length}
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {opportunities.filter((item) => item.status === 'pending').length}
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-500">Applications</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {opportunities.reduce((sum, item) => sum + (item.applications_count || 0), 0)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-600">Loading opportunities...</div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : (
          <DataTable
            columns={columns}
            data={opportunities}
            keyField="id"
            emptyMessage="You haven't posted any opportunities yet."
          />
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post New Opportunity"
        size="lg"
      >
        {renderForm(handleCreateSubmit)}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Opportunity"
        size="lg"
      >
        {renderForm(handleEditSubmit)}
      </Modal>

      <Modal
        isOpen={isApplicationsModalOpen}
        onClose={() => setIsApplicationsModalOpen(false)}
        title="Applications"
        size="xl"
      >
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{application.student_name}</h3>
                    <p className="text-sm text-gray-600">{application.student_email}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Applied on {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <StatusBadge
                    status={getApplicationBadgeStatus(application.status)}
                    label={formatApplicationStatus(application.status)}
                  />
                </div>

                {application.notes ? (
                  <p className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {application.notes}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">CVs</p>
                    <div className="mt-2 space-y-2">
                      {(application.cv_files || []).length > 0 ? (
                        application.cv_files.map((file) => (
                          <button
                            key={`cv-${application.id}-${file.index}`}
                            type="button"
                            className="block text-left text-sm text-primary-700 underline"
                            onClick={() => handleDownloadFile(application.id, 'cvs', file.index, file.original_name)}
                          >
                            Download {file.original_name || `CV ${file.index + 1}`}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No CVs uploaded.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">Motivation Letters</p>
                    <div className="mt-2 space-y-2">
                      {(application.motivation_letter_files || []).length > 0 ? (
                        application.motivation_letter_files.map((file) => (
                          <button
                            key={`letter-${application.id}-${file.index}`}
                            type="button"
                            className="block text-left text-sm text-primary-700 underline"
                            onClick={() => handleDownloadFile(application.id, 'motivation_letters', file.index, file.original_name)}
                          >
                            Download {file.original_name || `Letter ${file.index + 1}`}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No motivation letters uploaded.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primary text-sm"
                      onClick={() => handleApplicationDecision(activeOpportunityId, application.id, 'approved')}
                    disabled={application.status === 'accepted'}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                      onClick={() => handleApplicationDecision(activeOpportunityId, application.id, 'denied')}
                    disabled={application.status === 'rejected'}
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No applications yet.</p>
        )}
      </Modal>
    </div>
  )
}

export default CompanyDashboard
