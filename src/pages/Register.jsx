import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to register.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(trimmedName, trimmedEmail, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Video className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">Korus</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Get started with real-time team meetings
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <Input
            label="Full Name"
            id="register-name"
            type="text"
            required
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            icon={User}
          />

          <Input
            label="Work Email"
            id="register-email"
            type="email"
            required
            placeholder="alex.morgan@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            icon={Mail}
          />

          <Input
            label="Password"
            id="register-password"
            type="password"
            required
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            icon={Lock}
          />

          <Input
            label="Confirm Password"
            id="register-confirm-password"
            type="password"
            required
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            icon={Lock}
          />

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span>
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2"
            icon={isSubmitting ? Loader2 : ArrowRight}
            iconPosition="right"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account & Continue'}
          </Button>
        </form>

        {/* Link to Login */}
        <div className="text-center mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
