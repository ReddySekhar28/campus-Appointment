
import { supabase } from '../lib/supabase';
import React, { useState } from 'react';
import { 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  Building,
  KeyRound,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

// Authorized Demo Rosters



// Known Student Email Lists for Strict Role Boundary Checking


export default function LoginPortal({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('student');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
const [rememberMe, setRememberMe] = useState(false); // 'student', 'faculty', 'admin'
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your registered email address first.');
      return;
    }

    if (!/^[^@\s]+@klu\.ac\.in$/i.test(cleanEmail)) {
      setError('Use your registered @klu.ac.in email address.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: 'https://campus-appointment-dfqe.vercel.app/reset-password'
        }
      );

      if (error) throw error;

      alert('If an account exists, a password reset email will be sent.');
    } catch (err) {
      setError(err.message || 'Unable to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
  setSelectedRole(role);
  setError('');
};

  
const handleLogin = async (e) => {
  e?.preventDefault();
  setError('');
  setIsLoading(true);

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    if (!cleanEmail || !cleanPassword) {
      throw new Error('Please enter your college email and password.');
    }

    const isStudentEmail =
  /^[^@\s]+@(klu\.ac\.in|gmail\.com)$/i.test(cleanEmail);

const isStaffOrAdminEmail =
  /^[^@\s]+@klu\.ac\.in$/i.test(cleanEmail);

if (selectedRole === 'student' && !isStudentEmail) {
  throw new Error('Students must use a @klu.ac.in or @gmail.com email.');
}

if (selectedRole !== 'student' && !isStaffOrAdminEmail) {
  throw new Error('Staff and administrators must use their @klu.ac.in email.');
}

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword
    });

    if (error) throw error;

    const user = data.user;
    const actualRole = user.app_metadata?.role;

    const expectedRole = {
  student: 'student',
  faculty: 'teacher',
  admin: 'admin'
}[selectedRole];

    if (!expectedRole || actualRole !== expectedRole) {
  await supabase.auth.signOut();

  const roleNames = {
    student: 'Student',
    faculty: 'Teacher / Staff',
    admin: 'Administrator'
  };

  throw new Error(
    `This account is not registered for the ${roleNames[selectedRole]} portal. Please select the correct login portal.`
  );
}

    const userProfile = {
  id: user.id,
  email: user.email,
  name: user.user_metadata?.full_name || cleanEmail.split('@')[0],
  role: actualRole === 'teacher' ? 'staff' : actualRole
};

    onLoginSuccess(userProfile);
  } catch (err) {
  console.error('CampusFlow login failed:', err);

  const message = (err?.message || '').toLowerCase();

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('user not found')
  ) {
    setError('Invalid email or password. Please check your ID and password.');
  } else if (message.includes('email not confirmed')) {
    setError('Your email is not verified. Please verify it before logging in.');
  } else if (message.includes('too many requests')) {
    setError('Too many login attempts. Please try again later.');
  } else {
    setError(err?.message || 'Login failed. Please try again.');
  }
} finally {
  setIsLoading(false);
}

  
};

const handleStudentSignup = async (e) => {
  e?.preventDefault();
  setError('');

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    if (selectedRole !== 'student') {
  throw new Error('Only student self-registration is available.');
}

const isKluEmail = /^[^@\s]+@klu\.ac\.in$/i.test(cleanEmail);
const isGmail = /^[^@\s]+@gmail\.com$/i.test(cleanEmail);

if (selectedRole === 'student' && !isKluEmail && !isGmail) {
  throw new Error('Students must use a @klu.ac.in or @gmail.com email.');
}

if (selectedRole === 'faculty' && !isKluEmail) {
  throw new Error('Teacher registration requires a @klu.ac.in email.');
}

    if (cleanPassword.length < 8) {
      throw new Error('Password must contain at least 8 characters.');
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanEmail.split('@')[0]
        },
        emailRedirectTo: import.meta.env.PROD
  ? 'https://campus-appointment-dfqe.vercel.app/'
  : `${window.location.origin}/`
      }
    });

    if (error) throw error;

    if (data.user && !data.session) {
      setError(
        'Registration successful! Please check your email inbox and verify your account before signing in.'
      );
    } else if (data.user) {
      // Do not grant a role from the browser.
      await supabase.auth.signOut();
      setError(
        'Registration received. Please verify your email. Supabase will assign the appropriate account role automatically.'
      );
    }
  } catch (err) {
    setError(err.message || 'Registration failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};



  

  
  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '2.25rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glowing top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: selectedRole === 'student' 
            ? 'linear-gradient(90deg, #6366f1, #38bdf8)' 
            : selectedRole === 'faculty'
            ? 'linear-gradient(90deg, #10b981, #3b82f6)'
            : 'linear-gradient(90deg, #f43f5e, #a855f7)'
        }} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)'
          }}>
            <Sparkles size={26} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            CampusFlow <span style={{ color: '#38bdf8' }}>AI</span> Portal
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#9ca3af', margin: 0 }}>
            Sign in with your verified campus email credentials
          </p>
        </div>

        {/* 3 Role Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.4rem',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.35rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '10px',
              border: selectedRole === 'student' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
              background: selectedRole === 'student' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(30, 41, 59, 0.8))' : 'transparent',
              color: selectedRole === 'student' ? '#ffffff' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s ease'
            }}
          >
            <GraduationCap size={18} color={selectedRole === 'student' ? '#818cf8' : '#64748b'} />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('faculty')}
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '10px',
              border: selectedRole === 'faculty' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
              background: selectedRole === 'faculty' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(30, 41, 59, 0.8))' : 'transparent',
              color: selectedRole === 'faculty' ? '#ffffff' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Briefcase size={18} color={selectedRole === 'faculty' ? '#34d399' : '#64748b'} />
            <span>Faculty / Staff</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            style={{
              padding: '0.65rem 0.5rem',
              borderRadius: '10px',
              border: selectedRole === 'admin' ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid transparent',
              background: selectedRole === 'admin' ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(30, 41, 59, 0.8))' : 'transparent',
              color: selectedRole === 'admin' ? '#ffffff' : '#9ca3af',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={18} color={selectedRole === 'admin' ? '#fda4af' : '#64748b'} />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Error Alert Banner with distinct styling */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            color: '#fca5a5',
            fontSize: '0.84rem',
            lineHeight: 1.45,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Role specific hint */}
          <div style={{
            fontSize: '0.76rem',
            color: selectedRole === 'faculty' ? '#34d399' : selectedRole === 'admin' ? '#fda4af' : '#a5b4fc',
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {selectedRole === 'student' && "🎓 Enter your student email (e.g. aisha.fatima@klu.ac.in)"}
{selectedRole === 'faculty' && "🏛️ Enter authorized faculty/staff email (e.g. priya.sharma@klu.ac.in). Student emails will be rejected."}
{selectedRole === 'admin' && "🛡️ Enter campus administrator email (e.g. admin.vance@klu.ac.in)"}
          </div>

          {/* College Email Input */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#e2e8f0',
              marginBottom: '0.4rem'
            }}>
              {selectedRole === 'student' ? 'Student College Email' : selectedRole === 'faculty' ? 'Faculty / Staff College Email' : 'Admin Security Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}>
                <Mail size={17} />
              </div>
              <input
                type="email"
                required
                className="input-text"
                style={{ paddingLeft: '2.5rem' }}
                placeholder={
  selectedRole === 'student'
    ? 'student@klu.ac.in'
    : selectedRole === 'faculty'
    ? 'faculty@klu.ac.in'
    : 'admin@klu.ac.in'
}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                Password
              </label>
              <button
  type="button"
  onClick={handleForgotPassword}
  disabled={isLoading}
>
  Forgot Password?
</button>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}>
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="input-text"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                            />

              {error && (
                <div
                  className="login-error"
                  role="alert"
                  style={{
                    color: '#dc2626',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginTop: '10px',
                    fontSize: '14px'
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.8rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.8rem', color: '#9ca3af' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#6366f1', borderRadius: '4px' }}
              />
              Remember on this campus device
            </label>

            <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} /> Campus SSO Active
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`btn ${selectedRole === 'admin' ? 'btn-emergency' : selectedRole === 'faculty' ? 'btn-success' : 'btn-primary'}`}
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
          >
            {isLoading ? (
              <span>Verifying Role Credentials...</span>
            ) : (
              <>
                <span>Sign In to {selectedRole === 'student' ? 'Student Hub' : selectedRole === 'faculty' ? 'Staff Desk' : 'Admin Control'}</span>
                <ArrowRight size={17} />
              </>
            )}
                    </button>

          {/* Student and Teacher Registration */}
{selectedRole === 'student' && (            <button
              type="button"
              onClick={handleStudentSignup}
              disabled={isLoading}
              style={{
                width: '100%',
                marginTop: '0.85rem',
                padding: '0.8rem',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#7dd3fc',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading
  ? 'Please wait...'
  : selectedRole === 'faculty'
    ? 'Create Teacher Account'
    : 'Create Student Account'}
            </button>
          )}
        </form>

        {/* 1-Click Quick Demo Login Pill Bar */}

       
        {/* Public browse fallback */}
        
      </div>
    </div>
  );
}