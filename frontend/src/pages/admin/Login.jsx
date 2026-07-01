import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiLock, FiMail } from 'react-icons/fi';
import { Button, Card, Input, Modal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { forgotPassword } from '../../services/authService';
import { extractErrorMessage } from '../../services/apiClient';
import { emailRules } from '../../utils/validators';

function ForgotPasswordModal({ open, onClose }) {
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const close = () => {
    setMessage('');
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const res = await forgotPassword(data.email);
      setMessage(res.data?.message || 'If an account exists for this email, a reset link has been sent.');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={open} onClose={close} title="Reset Password">
      {message ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{message}</p>
          <Button className="w-full" onClick={close}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-slate-500">
            Enter your admin email address and we&apos;ll help you reset your password.
          </p>
          <Input
            label="Email"
            required
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email', emailRules)}
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Send Reset Instructions
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Visitor Portal Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage visitors, reports and settings.</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              required
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email', emailRules)}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              <FiLock size={16} />
              Sign In
            </Button>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <FiMail size={14} />
              Forgot password?
            </button>
          </form>
        </Card>
      </div>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
