import React from 'react';
import { Ticket, Clock, MapPin, CheckCircle, AlertCircle, Bell, ArrowRight, ShieldCheck, TrendingDown, Sparkles } from 'lucide-react';

export default function QueueTracker({ ticket, onDismiss }) {
  if (!ticket) return null;

  const isEmergency = ticket.isEmergency;
  const isCalled = ticket.status === 'CALLED' || ticket.status === 'IN_PROGRESS';
  const isCompleted = ticket.status === 'COMPLETED';

  return (
    <div style={{
      background: isEmergency 
        ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.18), rgba(15, 23, 42, 0.95))'
        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(15, 23, 42, 0.95))',
      border: `1px solid ${isEmergency ? 'rgba(244, 63, 94, 0.45)' : 'rgba(99, 102, 241, 0.45)'}`,
      borderRadius: '20px',
      padding: '1.75rem',
      marginBottom: '2.5rem',
      boxShadow: isEmergency ? '0 10px 30px rgba(244, 63, 94, 0.25)' : '0 10px 30px rgba(99, 102, 241, 0.2)',
      position: 'relative'
    }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: isEmergency ? 'rgba(244, 63, 94, 0.25)' : 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ticket size={24} color={isEmergency ? '#fda4af' : '#a5b4fc'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3af', textTransform: 'uppercase', fontWeight: 600 }}>
                Live Virtual Queue Ticket
              </span>
              <span className={`badge ${isEmergency ? 'badge-emergency' : 'badge-primary'}`}>
                {isEmergency ? '🚨 Emergency Priority' : 'Standard Ticket'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', margin: 0 }}>
              {ticket.ticketId}
            </h2>
          </div>
        </div>

        {/* Live Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: isCalled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${isCalled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            padding: '0.45rem 0.9rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: isCalled ? '#34d399' : '#e2e8f0',
            fontWeight: 700,
            fontSize: '0.88rem'
          }}>
            {isCalled ? (
              <>
                <Bell className="animate-bounce" size={16} color="#34d399" />
                <span>NOW SERVING AT COUNTER!</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle size={16} color="#34d399" />
                <span>SERVICE & SIGNATURE COMPLETED</span>
              </>
            ) : (
              <>
                <Clock size={16} color="#38bdf8" />
                <span>Position in Line: #{ticket.position || 1}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.65)',
        padding: '1.25rem',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Requested Service
          </div>
          <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '0.2rem' }}>
            {ticket.serviceName}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            <MapPin size={13} color="#38bdf8" />
            <span>Counter & Office</span>
          </div>
          <div style={{ fontSize: '0.92rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.2rem' }}>
            {ticket.counter}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            {ticket.office}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Wait
          </div>
          <div style={{ fontSize: '1.15rem', color: isEmergency ? '#fda4af' : '#a5b4fc', fontWeight: 800, marginTop: '0.1rem' }}>
            {isCalled ? 'Proceed to Desk' : isCompleted ? '0 mins (Done)' : `~${ticket.estimatedWaitMinutes || 0} mins`}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Student Info
          </div>
          <div style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600, marginTop: '0.2rem' }}>
            {ticket.studentName} ({ticket.studentId})
          </div>
        </div>
      </div>

      {/* Dynamic Queue Reduction Notification */}
      {!isCompleted && !isCalled && (
        <div style={{
          fontSize: '0.8rem',
          color: '#34d399',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '0.55rem 0.9rem',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          marginBottom: '0.75rem'
        }}>
          <TrendingDown size={15} />
          <span>
            <strong>Dynamic Queue Sync:</strong> When the counter officer completes signatures and stamps for students ahead of you, your wait time updates automatically in real time.
          </span>
        </div>
      )}

      {/* Emergency Notice */}
      {isEmergency && (
        <div style={{
          fontSize: '0.8rem',
          color: '#fda4af',
          background: 'rgba(244, 63, 94, 0.1)',
          padding: '0.65rem 1rem',
          borderRadius: '10px',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <ShieldCheck size={16} />
          <span>
            <strong>Protected Emergency Slot:</strong> Stated reason: <em>"{ticket.reason}"</em>. Please bring your supporting physical passport/embassy letter for signature verification.
          </span>
        </div>
      )}

      {/* Dismiss / Close button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          onClick={onDismiss}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem' }}
        >
          Dismiss Ticket View
        </button>
      </div>
    </div>
  );
}
