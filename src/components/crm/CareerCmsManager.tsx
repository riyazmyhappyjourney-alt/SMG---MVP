import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  Users,
  Eye
} from 'lucide-react';

export interface CareerPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CareerApplication {
  id: string;
  position_id: string | null;
  position_title: string;
  applicant_name: string;
  email: string;
  phone: string;
  experience_years: string;
  resume_url: string;
  cover_note: string;
  status: string;
  created_at: string;
}

export const CareerCmsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'APPLICATIONS'>('POSITIONS');
  const [positions, setPositions] = useState<CareerPosition[]>([]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for creating / editing position
  const [isAdding, setIsAdding] = useState(false);
  const [editingPos, setEditingPos] = useState<CareerPosition | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formLocation, setFormLocation] = useState('Bengaluru, India (On-site / Hybrid)');
  const [formType, setFormType] = useState('Full-time');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Application detail modal
  const [selectedApp, setSelectedApp] = useState<CareerApplication | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, appRes] = await Promise.all([
        fetch('/api/crm/careers/positions'),
        fetch('/api/crm/careers/applications')
      ]);

      if (posRes.ok) {
        const pData = await posRes.json();
        if (pData.success && Array.isArray(pData.positions)) {
          setPositions(pData.positions);
        }
      } else {
        setError('Failed to fetch career positions.');
      }

      if (appRes.ok) {
        const aData = await appRes.json();
        if (aData.success && Array.isArray(aData.applications)) {
          setApplications(aData.applications);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to career CMS API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddForm = () => {
    setEditingPos(null);
    setFormTitle('');
    setFormDept('Sales & Field Operations');
    setFormLocation('Bengaluru, India (On-site / Hybrid)');
    setFormType('Full-time');
    setFormDescription('');
    setFormIsActive(true);
    setIsAdding(true);
  };

  const openEditForm = (pos: CareerPosition) => {
    setEditingPos(pos);
    setFormTitle(pos.title);
    setFormDept(pos.department);
    setFormLocation(pos.location);
    setFormType(pos.employment_type);
    setFormDescription(pos.description);
    setFormIsActive(pos.is_active);
    setIsAdding(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDept.trim() || !formDescription.trim()) {
      setError('Title, department, and description are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingPos) {
        // Update
        const res = await fetch(`/api/crm/careers/positions/${editingPos.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            department: formDept,
            location: formLocation,
            employment_type: formType,
            description: formDescription,
            is_active: formIsActive
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update position.');
        }
        setSuccessMsg(`Position "${formTitle}" updated successfully.`);
      } else {
        // Create
        const res = await fetch('/api/crm/careers/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            department: formDept,
            location: formLocation,
            employment_type: formType,
            description: formDescription,
            is_active: formIsActive
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create position.');
        }
        setSuccessMsg(`Position "${formTitle}" created successfully.`);
      }

      setIsAdding(false);
      setEditingPos(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Error saving position.');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleActive = async (pos: CareerPosition) => {
    try {
      const res = await fetch(`/api/crm/careers/positions/${pos.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !pos.is_active })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle status.');
      }
      setSuccessMsg(`Position status set to ${!pos.is_active ? 'Active' : 'Paused'}.`);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Error updating status.');
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleDeletePosition = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete position "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/crm/careers/positions/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete position.');
      }
      setSuccessMsg(`Position "${title}" deleted.`);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Error deleting position.');
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-[#0073E6]" />
            <h3 className="text-base font-bold text-slate-800">Careers & Talent CMS</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage open job positions published to the website and review submitted applicant candidate profiles.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh positions and applicants"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'POSITIONS' && (
            <button
              type="button"
              onClick={openAddForm}
              className="px-3.5 py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('POSITIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'POSITIONS'
              ? 'bg-[#0073E6] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Open Positions ({positions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'APPLICATIONS'
              ? 'bg-[#0073E6] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Candidate Applications ({applications.length})</span>
          {applications.length > 0 && (
            <span className="bg-blue-200 text-[#005BB5] px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* POSITIONS TAB */}
      {activeTab === 'POSITIONS' && (
        <div className="space-y-4">
          {/* Add / Edit Form Modal */}
          {isAdding && (
            <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-800">
                  {editingPos ? 'Edit Position' : 'Post New Career Opening'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePosition} className="space-y-4 text-xs font-['Poppins']">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Role Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Residential Relationship Manager"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales & Field Operations, Legal & Compliance"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru (East: Whitefield / ORR)"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Description & Responsibilities *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe day-to-day responsibilities, ideal candidate background, and expectations..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-[#0073E6] focus:ring-[#0073E6] cursor-pointer"
                  />
                  <label htmlFor="isActiveCheckbox" className="text-slate-700 cursor-pointer font-medium">
                    Publish immediately as active opening on public careers page
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold rounded-lg cursor-pointer"
                  >
                    {submitting ? 'Saving...' : editingPos ? 'Save Changes' : 'Publish Position'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Positions Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {positions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No career positions found. Click "Post New Role" to create your first listing.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-['Poppins']">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Role Title</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {positions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-['Montserrat']">
                          {pos.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{pos.department}</td>
                        <td className="py-3 px-4 text-slate-600">{pos.location}</td>
                        <td className="py-3 px-4 text-slate-500">{pos.employment_type}</td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(pos)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              pos.is_active
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {pos.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{pos.is_active ? 'Active' : 'Paused'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(pos)}
                              className="p-1.5 text-slate-500 hover:text-[#0073E6] hover:bg-slate-100 rounded cursor-pointer transition-colors"
                              title="Edit position"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePosition(pos.id, pos.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                              title="Delete position"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANDIDATE APPLICATIONS TAB */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-[#0073E6] shrink-0" />
              <span>
                Talent Forwarding Active: Candidate applications are automatically mirrored to{' '}
                <strong className="text-[#005BB5]">sellmyghar1@gmail.com</strong> for instantaneous HR review.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No candidate applications received yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-['Poppins']">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Role Applied</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Experience</th>
                      <th className="py-3 px-4">Resume</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-['Montserrat']">
                          {app.applicant_name}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {app.position_title}
                        </td>
                        <td className="py-3 px-4 text-slate-600 space-y-0.5">
                          <div>
                            <a href={`mailto:${app.email}`} className="text-[#0073E6] hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{app.email}</span>
                            </a>
                          </div>
                          <div>
                            <a href={`tel:${app.phone}`} className="text-slate-500 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{app.phone}</span>
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{app.experience_years}</td>
                        <td className="py-3 px-4">
                          {app.resume_url ? (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#0073E6] hover:underline font-semibold"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View CV</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="p-1.5 text-slate-500 hover:text-[#0073E6] hover:bg-slate-100 rounded cursor-pointer transition-colors"
                            title="View candidate details & cover note"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 font-['Poppins']">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Montserrat']">
                  {selectedApp.applicant_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Applied for: <strong className="text-slate-700">{selectedApp.position_title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <a href={`mailto:${selectedApp.email}`} className="text-[#0073E6] font-semibold hover:underline">
                    {selectedApp.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                  <a href={`tel:${selectedApp.phone}`} className="text-slate-800 font-semibold hover:underline">
                    {selectedApp.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                  <span className="text-slate-800 font-semibold">{selectedApp.experience_years}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted At</span>
                  <span className="text-slate-800 font-semibold">{new Date(selectedApp.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedApp.resume_url && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Resume / Portfolio:</span>
                  <a
                    href={selectedApp.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#0073E6] hover:underline font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Candidate Resume Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-bold block mb-1">Candidate Cover Note:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {selectedApp.cover_note || 'No additional cover note provided.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
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
