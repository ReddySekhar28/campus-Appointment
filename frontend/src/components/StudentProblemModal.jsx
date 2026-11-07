import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Sparkles, 
  Send, 
  Upload, 
  CheckCircle2, 
  Zap, 
  Building2, 
  ShieldAlert, 
  FileText,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentProblemModal({ currentUser, onClose, onProblemSubmitted, services = [] }) {
  const [formData, setFormData] = useState({
    title: 'Urgent I-20 Travel Endorsement & Visa Stamp',
    description: 'My visa interview at the embassy is scheduled for tomorrow at 8:30 AM. I need an official signed endorsement on my I-20 before 4 PM today.',
    serviceId: 'SRV-INT-001',
    isUrgent: true,
    urgencyReason: 'Consulate visa appointment tomorrow morning',
    joinQueueImmediately: true
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProblem, setSubmittedProblem] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let docName = null;
      if (selectedFile) {
        docName = selectedFile.name;
        // presigned upload simulation
        await api.getS3UploadPresignedUrl(selectedFile.name, selectedFile.type);
      }

      const res = await api.submitStudentProblem({
        ...formData,
        studentName: currentUser?.name || 'Aisha Fatima',
        studentId: currentUser?.studentId || 'STU-8842',
        email: currentUser?.email || 'aisha.fatima@campus.edu',
        supportingDocName: docName
      });

      setSubmittedProblem(res);
      if (onProblemSubmitted) onProblemSubmitted(res);
    } catch (err) {
      alert('Error submitting problem: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <AlertCircle size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Submit Campus Problem or Inquiry
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                AI routes directly to the designated department counter desk
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

        {submittedProblem ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <CheckCircle2 size={34} color="#10b981" />
            </div>

            <h4 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.35rem' }}>
              Problem Logged & Synced with Staff Desk!
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
              Ticket Reference: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{submittedProblem.problemId}</strong>
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '14px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.86rem',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ color: '#e2e8f0', marginBottom: '0.4rem' }}>
                <strong>Assigned Counter:</strong> <span style={{ color: '#38bdf8' }}>{submittedProblem.assignedCounter}</span>
              </div>
              <div style={{ color: '#e2e8f0', marginBottom: '0.4rem' }}>
                <strong>Duty Staff Officer:</strong> {submittedProblem.assignedStaff}
              </div>
              <div style={{ color: '#e2e8f0', marginBottom: '0.4rem' }}>
                <strong>Priority Level:</strong> {submittedProblem.isUrgent ? '🚨 Urgent / High Priority' : 'Standard In-Queue'}
              </div>
              <div style={{
                color: '#34d399',
                fontSize: '0.8rem',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Zap size={14} />
                <span>Problem is now live and visible on the Staff Desk and Campus Admin Portals.</span>
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              Return to Student Hub
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Target Department Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Campus Department / Service Category
              </label>
              <select
                className="select-custom"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              >
                {services.map(s => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.category} — {s.name} ({s.counter})
                  </option>
                ))}
              </select>
            </div>

            {/* Problem Title */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Problem Summary / Issue Title *
              </label>
              <input
                type="text"
                required
                className="input-text"
                placeholder="e.g. Lost ID card access to lab, Bursar fee hold, Transcript seal needed"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Problem Detailed Description */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Detailed Description & Special Requirements *
              </label>
              <textarea
                required
                className="textarea-custom"
                rows={3}
                placeholder="Explain the specific issue, any deadlines, and what assistance you need from the counter officer..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Urgency & Reason */}
            <div style={{
              background: formData.isUrgent ? 'rgba(244, 63, 94, 0.12)' : 'rgba(30, 41, 59, 0.5)',
              border: `1px solid ${formData.isUrgent ? 'rgba(244, 63, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: formData.isUrgent ? '0.6rem' : 0 }}>
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  style={{ accentColor: '#f43f5e', width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: formData.isUrgent ? '#fda4af' : '#e2e8f0' }}>
                  🚨 Flag this problem as High Urgency / Critical Deadline
                </span>
              </label>

              {formData.isUrgent && (
                <div>
                  <input
                    type="text"
                    required={formData.isUrgent}
                    className="input-text"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                    placeholder="State urgency reason (e.g. Visa interview tomorrow, scholarship cutoff tonight)..."
                    value={formData.urgencyReason}
                    onChange={(e) => setFormData({ ...formData, urgencyReason: e.target.value })}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#fda4af', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldAlert size={12} />
                    Will be displayed in the Staff Emergency Triage Feed for fast-track verification.
                  </div>
                </div>
              )}
            </div>

            {/* S3 Supporting Document Attachment */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Supporting Document (Upload to Amazon S3)
              </label>
              <div style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '0.75rem',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.5)',
                cursor: 'pointer'
              }}>
                <input
                  type="file"
                  id="prob-s3-file"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="prob-s3-file" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={20} color="#818cf8" style={{ margin: '0 auto 0.25rem auto' }} />
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Upload Screenshot / Proof / Receipt (Optional)'}
                  </div>
                </label>
              </div>
            </div>

            {/* Join Queue Option */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={formData.joinQueueImmediately}
                  onChange={(e) => setFormData({ ...formData, joinQueueImmediately: e.target.checked })}
                  style={{ accentColor: '#6366f1' }}
                />
                <span>Automatically issue live digital queue ticket so staff can call me at the counter</span>
              </label>
            </div>

            {/* Submit Actions */}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Logging Problem...</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit & Notify Staff Desk</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
