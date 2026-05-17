import React, { useEffect, useState } from 'react'
import { authService } from '../services/auth'
import { updateCompanyProfile } from '../services/company'

const CompanyProfile = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'company',
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    setFormData((previous) => ({
      ...previous,
      name: localStorage.getItem('userName') || '',
      email: localStorage.getItem('userEmail') || '',
      role: currentUser?.role || 'company',
    }))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess('')

    try {
      const updatedUser = await updateCompanyProfile({ name: formData.name })
      localStorage.setItem('userName', updatedUser.name)
      window.dispatchEvent(new Event('auth-changed'))
      setSuccess('Company profile updated successfully.')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update company profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Update Company Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Edit the company information shown across the platform.
        </p>
      </div>

      <div className="card space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">Email is read-only because it is tied to account login.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              type="text"
              value={formData.role}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-600 capitalize"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => window.history.back()}>
              Back
            </button>
            <button type="submit" className="btn-primary" disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanyProfile
