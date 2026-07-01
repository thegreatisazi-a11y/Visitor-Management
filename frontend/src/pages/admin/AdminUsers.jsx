import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEdit2, FiUserX, FiKey, FiPlus } from 'react-icons/fi';
import { Card, Table, Pagination, Modal, ConfirmDialog, Button, Input } from '../../components/ui';
import { emailRules, mobileRules } from '../../utils/validators';
import { formatDateTime } from '../../utils/formatters';
import { listAdminUsers, createAdminUser, updateAdminUser, deactivateAdminUser, resetAdminUserPassword } from '../../services/adminUserService';
import { extractErrorMessage } from '../../services/apiClient';

const LIMIT = 10;
const STATUS_OPTIONS = ['active', 'inactive', 'blocked'];

function AdminUserFormModal({ open, mode, admin, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: admin || { status: 'active' } });

  useEffect(() => {
    if (open) reset(admin || { status: 'active' });
  }, [open, admin, reset]);

  const onSubmit = async (data) => {
    try {
      if (mode === 'edit') {
        await updateAdminUser(admin._id, { fullName: data.fullName, mobile: data.mobile, status: data.status });
        toast.success('Admin user updated');
      } else {
        await createAdminUser(data);
        toast.success('Admin user created');
      }
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Edit Admin User' : 'Add Admin User'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" required error={errors.fullName?.message} {...register('fullName', { required: 'Required' })} />
        <Input
          label="Email"
          required
          type="email"
          disabled={mode === 'edit'}
          error={errors.email?.message}
          {...register('email', emailRules)}
        />
        <Input label="Mobile" required error={errors.mobile?.message} {...register('mobile', mobileRules)} />
        {mode !== 'edit' && (
          <Input
            label="Password"
            type="password"
            required
            error={errors.password?.message}
            {...register('password', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })}
          />
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
          <select
            className="block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
            {...register('status')}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {mode === 'edit' ? 'Save Changes' : 'Create Admin User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ admin, onClose, onDone }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (admin) reset();
  }, [admin, reset]);

  if (!admin) return null;

  const onSubmit = async (data) => {
    try {
      await resetAdminUserPassword(admin._id, data.newPassword);
      toast.success('Password reset successfully');
      reset();
      onDone();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={!!admin} onClose={onClose} title={`Reset Password - ${admin.fullName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          required
          error={errors.newPassword?.message}
          {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Reset Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);

  const [formState, setFormState] = useState({ open: false, mode: 'create', admin: null });
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    listAdminUsers({ page, limit: LIMIT })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeactivate = async () => {
    try {
      await deactivateAdminUser(deactivateTarget._id);
      toast.success('Admin user deactivated');
      setDeactivateTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const columns = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className="capitalize text-slate-700">{r.status}</span>
      ),
    },
    { key: 'lastLoginAt', label: 'Last Login', render: (r) => formatDateTime(r.lastLoginAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button title="Edit" onClick={() => setFormState({ open: true, mode: 'edit', admin: r })} className="text-slate-500 hover:text-brand-600">
            <FiEdit2 size={16} />
          </button>
          <button title="Reset Password" onClick={() => setResetTarget(r)} className="text-slate-500 hover:text-brand-600">
            <FiKey size={16} />
          </button>
          <button
            title="Deactivate"
            disabled={r.status === 'inactive'}
            onClick={() => setDeactivateTarget(r)}
            className="text-slate-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiUserX size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage administrator accounts and access.</p>
        </div>
        <Button onClick={() => setFormState({ open: true, mode: 'create', admin: null })}>
          <FiPlus size={16} /> Add Admin User
        </Button>
      </div>

      <Card padded={false}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No admin users found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>

      <AdminUserFormModal
        open={formState.open}
        mode={formState.mode}
        admin={formState.admin}
        onClose={() => setFormState({ open: false, mode: 'create', admin: null })}
        onSaved={() => {
          setFormState({ open: false, mode: 'create', admin: null });
          fetchUsers();
        }}
      />

      <ResetPasswordModal admin={resetTarget} onClose={() => setResetTarget(null)} onDone={() => setResetTarget(null)} />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Admin User"
        message={`Are you sure you want to deactivate "${deactivateTarget?.fullName}"? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
