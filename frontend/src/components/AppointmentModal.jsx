import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';



export default function AppointmentModal({ service, onClose, onAppointmentBooked }) {
  const [formData, setFormData] = useState({
  studentName: '',
  studentId: '',
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  timeSlot: '10:30 AM - 11:00 AM'
});

const [identityLoading, setIdentityLoading] = useState(true);
const [identityError, setIdentityError] = useState('');
useEffect(() => {
  const loadUserIdentity = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        throw new Error('Please sign in with your KLU account.');
      }

      const user = data.user;
      const email = user.email?.trim().toLowerCase() || '';
      const role = user.app_metadata?.role;

      if (!email.endsWith('@klu.ac.in')) {
        throw new Error('Only KLU accounts can book appointments.');
      }

      if (!['student', 'teacher'].includes(role)) {
        throw new Error('Your account is not authorized to book appointments.');
      }

      const kluId = email.split('@')[0];

      if (!/^\d+$/.test(kluId)) {
        throw new Error('Your KLU email does not contain a valid numeric ID.');
      }

      setFormData(prev => ({
        ...prev,
        studentName:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          kluId,
        studentId: kluId
      }));

    } catch (error) {
      setIdentityError(error.message);
    } finally {
      setIdentityLoading(false);
    }
  };

  loadUserIdentity();
}, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  const availableSlots = [
    '09:00 AM - 09:30 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '01:30 PM - 02:00 PM',
    '02:30 PM - 03:00 PM',
    '03:30 PM - 04:00 PM'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (identityLoading || identityError) {
  alert(identityError || 'Loading your account details. Please wait.');
  return;
}
    setIsSubmitting(true);
    try {
      const appt = await api.bookAppointment(service.serviceId, formData);
      setConfirmed(appt);
      if (onAppointmentBooked) onAppointmentBooked(appt);
    } catch (err) {
      alert('Error booking appointment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Book Campus Appointment
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {service.name}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem',
              color: '#9ca3af',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {confirmed ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h4 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.35rem' }}>
              Appointment Confirmed!
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Confirmation code: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{confirmed.appointmentId}</strong>
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ color: '#e2e8f0', marginBottom: '0.3rem' }}>
                <strong>Date & Time:</strong> {confirmed.date} at {confirmed.timeSlot}
              </div>
              <div style={{ color: '#e2e8f0', marginBottom: '0.3rem' }}>
                <strong>Location:</strong> {confirmed.office} ({confirmed.counter})
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                Please arrive 5 minutes early with all required documents shown in the checklist.
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          
        
          <>
            {identityLoading && (
              <p style={{ color: '#38bdf8' }}>
                Loading your KLU account...
              </p>
            )}

            {identityError && (
              <p style={{ color: '#f87171' }}>
                {identityError}
              </p>
            )}

            <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  className="input-text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Student ID Number
                </label>
                <input
  type="text"
  required
  readOnly
  className="input-text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Appointment Date
              </label>
              <input
                type="date"
                required
                className="input-text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Select Available Time Slot
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, timeSlot: slot })}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      background: formData.timeSlot === slot ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      border: formData.timeSlot === slot ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: formData.timeSlot === slot ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Clock size={13} color={formData.timeSlot === slot ? '#38bdf8' : '#64748b'} />
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || identityLoading || !!identityError}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
          </>
        )}
      </div>
    </div>
  );
}
