'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const STAGES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
  'OFFER_SENT',
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'JOINED',
  'REJECTED',
  'ON_HOLD',
];

const emptyForm = {
  candidateName: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  appliedRole: '',
  department: '',
  branchName: '',
  source: '',
  expectedSalary: '',
  experience: '',
  noticePeriod: '',
  resumeUrl: '',
  photoUrl: '',
  documentUrl: '',
  stage: 'APPLIED',
  interviewDate: '',
  interviewerName: '',
  interviewRating: '',
  interviewRemarks: '',
  offeredSalary: '',
  joiningDate: '',
  offerLetterUrl: '',
  remarks: '',
  isActive: true,
};

export default function RecruitmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [offerFile, setOfferFile] = useState<File | null>(null);

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchItems = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/recruitment-candidates`, {
      params: {
        page,
        limit: 20,
        search,
        stage: stageFilter,
        branchName: branchFilter,
        department: departmentFilter,
        showHidden,
      },
      headers: headers(),
    });

    setItems(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, stageFilter, showHidden]);

  const uploadFile = async (file: File | null) => {
    if (!file) return '';

    return uploadPreparedFile({
      file,
      endpoint: `${API_BASE_URL}/staff/recruitment/file-upload`,
      token: localStorage.getItem('token'),
      fieldName: 'files',
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setResumeFile(null);
    setPhotoFile(null);
    setDocumentFile(null);
    setOfferFile(null);
  };

  const saveCandidate = async () => {
    if (!form.candidateName.trim()) {
      alert('Candidate name is required');
      return;
    }

    try {
      const [resumeUrl, photoUrl, documentUrl, offerLetterUrl] =
        await Promise.all([
          uploadFile(resumeFile),
          uploadFile(photoFile),
          uploadFile(documentFile),
          uploadFile(offerFile),
        ]);

      const payload = {
        ...form,
        expectedSalary: Number(form.expectedSalary || 0),
        interviewRating: Number(form.interviewRating || 0),
        offeredSalary: Number(form.offeredSalary || 0),
        resumeUrl: resumeUrl || form.resumeUrl,
        photoUrl: photoUrl || form.photoUrl,
        documentUrl: documentUrl || form.documentUrl,
        offerLetterUrl: offerLetterUrl || form.offerLetterUrl,
      };

      if (editingId) {
        await axios.patch(
          `${API_BASE_URL}/staff/recruitment-candidate/${editingId}`,
          payload,
          { headers: headers() },
        );
        alert('Candidate updated');
      } else {
        await axios.post(`${API_BASE_URL}/staff/recruitment-candidate`, payload, {
          headers: headers(),
        });
        alert('Candidate created');
      }

      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || 'Failed to save candidate');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      ...emptyForm,
      ...item,
      expectedSalary: String(item.expectedSalary || ''),
      interviewRating: String(item.interviewRating || ''),
      offeredSalary: String(item.offeredSalary || ''),
      interviewDate: item.interviewDate ? String(item.interviewDate).slice(0, 16) : '',
      joiningDate: item.joiningDate ? String(item.joiningDate).slice(0, 10) : '',
    });
    setResumeFile(null);
    setPhotoFile(null);
    setDocumentFile(null);
    setOfferFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideRestore = async (item: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring candidate?' : 'Reason for hiding candidate?',
      restore ? 'Valid candidate' : 'Wrong / duplicate / inactive candidate',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/recruitment-candidate/${item.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchItems();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Hiring & Recruitment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage candidate pipeline, interviews, offers and joining process.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Candidates</p>
          <p className="mt-2 text-2xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Interview</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {items.filter((i) => String(i.stage || '').includes('INTERVIEW')).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Selected / Offer</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {items.filter((i) => ['SELECTED', 'OFFER_SENT', 'OFFER_ACCEPTED'].includes(i.stage)).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Joined</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {items.filter((i) => i.stage === 'JOINED').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Candidate' : 'Add Candidate'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input placeholder="Candidate Name" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} className="rounded-xl border p-3 md:col-span-2" />
          <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="rounded-xl border p-3">
            {STAGES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>

          <input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Alternate Mobile" value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border p-3" />

          <input placeholder="Applied Role" value={form.appliedRole} onChange={(e) => setForm({ ...form, appliedRole: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Branch" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="rounded-xl border p-3" />

          <input placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-xl border p-3" />
          <input type="number" placeholder="Expected Salary" value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="rounded-xl border p-3" />

          <input placeholder="Notice Period" value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })} className="rounded-xl border p-3" />
          <input type="datetime-local" value={form.interviewDate} onChange={(e) => setForm({ ...form, interviewDate: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Interviewer Name" value={form.interviewerName} onChange={(e) => setForm({ ...form, interviewerName: e.target.value })} className="rounded-xl border p-3" />

          <input type="number" placeholder="Interview Rating" value={form.interviewRating} onChange={(e) => setForm({ ...form, interviewRating: e.target.value })} className="rounded-xl border p-3" />
          <input type="number" placeholder="Offered Salary" value={form.offeredSalary} onChange={(e) => setForm({ ...form, offeredSalary: e.target.value })} className="rounded-xl border p-3" />
          <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="rounded-xl border p-3" />

          <label className="rounded-xl border p-3 text-sm">
            Resume
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="mt-2 w-full" />
          </label>
          <label className="rounded-xl border p-3 text-sm">
            Photo
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="mt-2 w-full" />
          </label>
          <label className="rounded-xl border p-3 text-sm">
            Document
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className="mt-2 w-full" />
          </label>
          <label className="rounded-xl border p-3 text-sm md:col-span-3">
            Offer Letter
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setOfferFile(e.target.files?.[0] || null)} className="mt-2 w-full" />
          </label>
        </div>

        <textarea placeholder="Interview Remarks" value={form.interviewRemarks} onChange={(e) => setForm({ ...form, interviewRemarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />
        <textarea placeholder="General Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={saveCandidate} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
            {editingId ? 'Update Candidate' : 'Add Candidate'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white">
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-5">
          <input placeholder="Search candidate" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border p-3" />
          <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }} className="rounded-xl border p-3">
            <option value="">All Stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
          <input placeholder="Branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="rounded-xl border p-3" />
          <input placeholder="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-xl border p-3" />
          <label className="rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={showHidden} onChange={(e) => { setShowHidden(e.target.checked); setPage(1); }} /> View Hidden
          </label>
        </div>

        <button onClick={() => { setPage(1); fetchItems(); }} className="mt-3 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white">
          Apply / Refresh
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Candidate Register</h2>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No candidates found.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`rounded-xl border p-4 ${item.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.candidateName} className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold">
                        {(item.candidateName || '?').charAt(0)}
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-gray-900">{item.candidateName}</p>
                      <p className="text-sm text-gray-500">{item.appliedRole || '-'} | {item.department || '-'} | {item.branchName || '-'}</p>
                      <p className="text-sm text-gray-500">{item.mobile || '-'} | {item.stage}</p>
                      <p className="text-sm text-gray-500">Expected: ₹{Number(item.expectedSalary || 0).toLocaleString('en-IN')} | Offered: ₹{Number(item.offeredSalary || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!item.isHidden && (
                      <button onClick={() => startEdit(item)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                        Edit
                      </button>
                    )}

                    {item.resumeUrl && <a href={item.resumeUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white">Resume</a>}
                    {item.documentUrl && <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white">Document</a>}
                    {item.offerLetterUrl && <a href={item.offerLetterUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white">Offer</a>}

                    <button onClick={() => hideRestore(item, !!item.isHidden)} className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${item.isHidden ? 'bg-green-600' : 'bg-red-600'}`}>
                      {item.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>

                {(item.interviewRemarks || item.remarks) && (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    {item.interviewRemarks && <p>Interview: {item.interviewRemarks}</p>}
                    {item.remarks && <p>Remarks: {item.remarks}</p>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">Previous</button>
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}