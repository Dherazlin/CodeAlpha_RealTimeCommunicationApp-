import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@company.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleRegister = (e) => {
    e.preventDefault();
    navigate('/dashboard');
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
            Get started with seamless team video meetings
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          <Input
            label="Full Name"
            id="register-name"
            type="text"
            required
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={User}
          />

          <Input
            label="Work Email"
            id="register-email"
            type="email"
            required
            placeholder="alex.morgan@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
          />

          <Input
            label="Password"
            id="register-password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
          />

          <Input
            label="Confirm Password"
            id="register-confirm-password"
            type="password"
            required
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
                I agree to the{' '}
                <a href="#terms" className="text-brand-600 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            icon={ArrowRight}
            iconPosition="right"
          >
            Create Account & Continue
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
