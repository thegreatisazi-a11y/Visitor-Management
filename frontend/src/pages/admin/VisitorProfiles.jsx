import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSearch, FiImage, FiEdit2, FiCamera } from 'react-icons/fi';
import { Card, Table, Pagination, Input, Modal, Button, Spinner, CameraCapture } from '../../components/ui';
import { emailRules, minLen, mobileRules, nameRules } from '../../utils/validators';
import { formatDateTime } from '../../utils/formatters';
import {
  listProfiles,
  getProfilePhoto,
  updateProfile,
  reregisterFace,
} from '../../services/visitorProfileService';
import { extractErrorMessage } from '../../services/apiClient';

const LIMIT = 10;

const FACE_REGISTERED_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

function PhotoModal({ profile, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return undefined;
    let objectUrl;
    setLoading(true);
    getProfilePhoto(profile._id)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile]);

  if (!profile) return null;

  return (
    <Modal open={!!profile} onClose={onClose} title={`Photo - ${profile.visitorName}`}>
      <div className="flex min-h-[240px] items-center justify-center">
        {loading ? <Spinner size={32} /> : url ? <img src={url} alt={profile.visitorName} className="max-h-80 rounded-lg" /> : <p className="text-sm text-slate-500">No photo available.</p>}
      </div>
    </Modal>
  );
}

function EditModal({ profile, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: profile || {} });

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  if (!profile) return null;

  const onSubmit = async (data) => {
    try {
      await updateProfile(profile._id, {
        visitorName: data.visitorName,
        companyName: data.companyName,
        mobileNo: data.mobileNo,
        emailId: data.emailId,
        address: data.address,
      });
      toast.success('Profile updated');
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={!!profile} onClose={onClose} title={`Edit Profile - ${profile.visitorId}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Visitor Name" required error={errors.visitorName?.message} {...register('visitorName', nameRules)} />
        <Input label="Company Name" error={errors.companyName?.message} {...register('companyName', minLen(2, 'Company name'))} />
        <Input label="Mobile No." type="tel" maxLength={10} error={errors.mobileNo?.message} {...register('mobileNo', mobileRules)} />
        <Input label="Email ID" type="email" error={errors.emailId?.message} {...register('emailId', emailRules)} />
        <Input label="Address" error={errors.address?.message} {...register('address', minLen(5, 'Address'))} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReregisterModal({ profile, onClose, onSaved }) {
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPhoto(null);
  }, [profile]);

  if (!profile) return null;

  const handleSave = async () => {
    if (!photo) return;
    setSaving(true);
    try {
      await reregisterFace(profile._id, photo);
      toast.success('Face re-registered successfully');
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!profile} onClose={onClose} title={`Re-register Face - ${profile.visitorName}`}>
      <p className="mb-3 text-sm text-slate-500">
        Capture a new live photo to replace this visitor&apos;s registered face. The old embedding and photo are overwritten.
      </p>
      <CameraCapture captured={photo} onCapture={setPhoto} onRetake={() => setPhoto(null)} />
      <div className="mt-4 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" loading={saving} disabled={!photo} onClick={handleSave}>
          Save New Face
        </Button>
      </div>
    </Modal>
  );
}

export default function VisitorProfiles() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [faceRegistered, setFaceRegistered] = useState('');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [photoProfile, setPhotoProfile] = useState(null);
  const [editProfile, setEditProfile] = useState(null);
  const [reregisterProfile, setReregisterProfile] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(() => {
    setLoading(true);
    listProfiles({ page, limit: LIMIT, search: debouncedSearch, faceRegistered: faceRegistered || undefined })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, faceRegistered]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = [
    { key: 'visitorId', label: 'Visitor ID' },
    { key: 'visitorName', label: 'Name' },
    { key: 'companyName', label: 'Company' },
    { key: 'mobileNo', label: 'Mobile' },
    {
      key: 'faceRegistered',
      label: 'Face Registered',
      render: (r) =>
        r.faceRegistered ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Yes</span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">No</span>
        ),
    },
    { key: 'faceRegisteredAt', label: 'Registered At', render: (r) => formatDateTime(r.faceRegisteredAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button title="View Photo" onClick={() => setPhotoProfile(r)} className="text-slate-500 hover:text-brand-600">
            <FiImage size={16} />
          </button>
          <button title="Edit Details" onClick={() => setEditProfile(r)} className="text-slate-500 hover:text-brand-600">
            <FiEdit2 size={16} />
          </button>
          <button title="Re-register Face" onClick={() => setReregisterProfile(r)} className="text-slate-500 hover:text-emerald-600">
            <FiCamera size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Visitor Profiles</h1>
        <p className="mt-1 text-sm text-slate-500">Registered visitors with face recognition enabled.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input placeholder="Search ID, name, mobile, company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={faceRegistered}
          onChange={(e) => {
            setFaceRegistered(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border-0 px-3 py-2.5 text-sm text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
        >
          <option value="">Face Registered: All</option>
          {FACE_REGISTERED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              Face Registered: {o.label}
            </option>
          ))}
        </select>
      </div>

      <Card padded={false} className="w-full max-w-full">
        <Table columns={columns} data={data} loading={loading} emptyMessage="No visitor profiles found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>

      <PhotoModal profile={photoProfile} onClose={() => setPhotoProfile(null)} />
      <EditModal
        profile={editProfile}
        onClose={() => setEditProfile(null)}
        onSaved={() => {
          setEditProfile(null);
          fetchList();
        }}
      />
      <ReregisterModal
        profile={reregisterProfile}
        onClose={() => setReregisterProfile(null)}
        onSaved={() => {
          setReregisterProfile(null);
          fetchList();
        }}
      />
    </div>
  );
}
