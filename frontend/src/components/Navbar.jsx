import React from 'react';
import {
  Sparkles,
  LogOut,
  LogIn,
  RefreshCw
} from 'lucide-react';

export default function Navbar({
  currentUser,
  onLogout,
  onOpenLogin,
  onResetData
}) {
  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div 
  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                CampusFlow <span style={{ color: '#38bdf8' }}>AI</span>
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                AWS Bedrock
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3af', margin: 0 }}>
              Smart Service Discovery & Regulated Queue Engine
            </p>
          </div>
        </div>

        

        {/* Right Section: User Profile & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            /* Logged in User Bar */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             
                

              {/* User Profile Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}>
                  {currentUser.avatar || '👤'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {currentUser.role === 'student' ? currentUser.studentId : currentUser.role === 'staff' ? 'Staff Desk' : 'Administrator'}
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                title="Sign Out of CampusFlow"
                style={{ padding: '0.45rem 0.75rem' }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            /* Logged Out / Guest view */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onOpenLogin}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.5rem 1.1rem' }}
              >
                <LogIn size={15} />
                <span>Campus Sign In</span>
              </button>
            </div>
          )}

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            className="btn btn-secondary btn-sm"
            title="Reset to fresh demo dataset"
            style={{ padding: '0.5rem' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
