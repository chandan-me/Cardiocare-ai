import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { FaHeartbeat, FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      await login(data.email, data.password, data.rememberMe);
      
      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: 'Login successful, loading your dashboard.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err);
      Swal.fire({
        icon: 'error',
        title: 'Sign In Failed',
        text: err,
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-400/20 dark:bg-sky-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-400/20 dark:bg-rose-900/10 rounded-full blur-3xl -z-10" />

      <div className="glass-card w-full max-w-md rounded-2xl p-8 glow-blue border border-white/40">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <FaHeartbeat className="h-10 w-10 text-rose-500 animate-pulse-heart" />
            <span className="font-display font-extrabold text-2xl bg-gradient-to-r from-rose-500 to-sky-600 bg-clip-text text-transparent">
              Pulse AI
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome Back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your clinical diagnostics account</p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <FaEnvelope />
              </span>
              <input
                type="email"
                placeholder="doctor@hospital.org"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-colors duration-150 ${
                  errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>}
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <FaLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-colors duration-150 ${
                  errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 font-semibold">{errors.password.message}</p>}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-medical-600 focus:ring-medical-500 h-4 w-4"
                {...register('rememberMe')}
              />
              <span className="font-medium">Remember me</span>
            </label>
            
            <a href="#" className="font-semibold text-medical-600 hover:underline dark:text-sky-400">
              Forgot Password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 text-white font-bold shadow-lg shadow-medical-500/20 hover:scale-101 hover:shadow-sky-500/10 transition active:scale-99 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                Sign In
                <FaArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs">
          <span className="text-slate-500 dark:text-slate-400">Don't have an account?</span>{' '}
          <Link to="/register" className="font-bold text-medical-600 hover:underline dark:text-sky-400">
            Register Clinical User
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
