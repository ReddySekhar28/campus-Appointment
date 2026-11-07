import React, { useState } from 'react';
import { X, AlertOctagon, Upload, ShieldAlert, CheckCircle2, Clock, Calendar, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function EmergencyModal({ service, onClose, onEmergencySuccess }) {
  const [formData, setFormData] = useState({
    studentName: 'Aisha Fatima',
    studentId: 'STU-8842',
    email: 'aisha.f@campus.edu',
    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    reason: 'Embassy visa interview scheduled for tomorrow at 8:30 AM. Need official stamped travel endorsement immediately.'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorResult, setErrorResult] = useState(null);

  const quotaLimit = service.emergencyQuotaPerDay || 3;
  const quotaUsed = service.emergencySlotsUsedToday || 0;
  const quotaRemaining = Math.max(0, quotaLimit - quotaUsed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorResult(null);

    try {
      // 1. Simulate S3 Presigned URL Upload for supporting document
      let docUrl = null;
      if (selectedFile) {
        const presigned = await api.getS3UploadPresignedUrl(selectedFile.name, selectedFile.type);
        docUrl = presigned.uploadUrl;
      }

      // 2. Submit to Emergency Quota Engine
      const res = await api.requestEmergencySlot(service.serviceId, {
        ...formData,
        supportingDocName: selectedFile ? selectedFile.name : 'proof_embassy_interview.pdf',
        supportingDocUrl: docUrl
      });

      if (res.success) {
        onEmergencySuccess(res.ticket);
        onClose();
      } else {
        setErrorResult(res);
      }
    } catch (err) {
      setErrorResult({
        message: err.message || 'Failed to submit emergency priority request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertOctagon size={20} color="#fda4af" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Emergency Priority Request
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

        {/* Quota Gauge Banner */}
        <div style={{
          background: quotaRemaining > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fda4af' }}>
              Regulated Emergency Quota (Daily Cap)
            </div>
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
              Strict cap of {quotaLimit} protected emergency slots per day.
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: quotaRemaining > 0 ? '#ffffff' : '#f87171'
            }}>
              {quotaRemaining} of {quotaLimit} Slots Left
            </span>
          </div>
        </div>

        {/* Quota Exhausted Fallback view */}
        {errorResult?.error === 'QUOTA_EXHAUSTED' ? (
          <div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '1rem',
              color: '#fca5a5',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              marginBottom: '1.25rem'
            }}>
              <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                🚨 Daily Emergency Quota Reached ({quotaUsed}/{quotaLimit})
              </p>
              <p style={{ fontSize: '0.82rem', margin: 0 }}>
                To maintain fair queue access, emergency skips are strictly capped. You may choose an alternative option below or speak directly to a staff member for manual exceptions:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {errorResult.fallbackOptions?.map((opt, idx) => (
                <div key={idx} style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#e2e8f0'
                }}>
                  <Clock size={16} color="#38bdf8" />
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>
              Close and Choose Alternative
            </button>
          </div>
        ) : (
          /* Normal Emergency Request Form */
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Student Name
                </label>
                <input
                  type="text"
                  required
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
                  className="input-text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input-text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#fda4af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Verifiable Deadline Date *
                </label>
                <input
                  type="date"
                  required
                  className="input-text"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#fda4af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Emergency Justification Reason *
              </label>
              <textarea
                required
                className="textarea-custom"
                placeholder="Explain why this request cannot wait for standard queue or appointment (e.g. Visa interview, official flight, scholarship cutoff)..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            {/* S3 Supporting Document Attachment */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Supporting Document Proof (Upload to Amazon S3)
              </label>
              <div style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.5)',
                cursor: 'pointer'
              }}>
                <input
                  type="file"
                  id="s3-file-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="s3-file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={22} color="#818cf8" style={{ margin: '0 auto 0.4rem auto' }} />
                  <div style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Select Passport / Embassy Appointment Letter / Notice'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    PDF, PNG, or JPG up to 10MB (Secured via AWS S3 Presigned URL)
                  </div>
                </label>
              </div>
            </div>

            {/* Authoritative Warning Notice */}
            <div style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <ShieldAlert size={14} color="#f59e0b" style={{ display: 'inline', marginRight: 4 }} />
              <strong>Verification Policy:</strong> AI flags urgency, but human staff review is authoritative. Misrepresenting deadlines may lead to cancellation and standard queue repositioning.
            </div>

            {/* Submit Buttons */}
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
                className="btn btn-emergency"
                disabled={isSubmitting || quotaRemaining === 0}
              >
                {isSubmitting ? 'Reserving Quota Slot...' : `Request Emergency Slot (${quotaRemaining} Left)`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
