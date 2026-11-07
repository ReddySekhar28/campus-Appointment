import React, { useState } from 'react';
import { X, Globe2, Upload, CheckCircle2, FileText } from 'lucide-react';
import { api } from '../services/api';

export default function DigitalRequestModal({ service, onClose, onSubmitted }) {
  const [formData, setFormData] = useState({
    studentName: 'Marcus Vance',
    studentId: 'STU-1049',
    email: 'marcus.v@campus.edu',
    details: 'Requesting official stamped letter of enrollment verification and course transcript for summer internship.'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileUrl = null;
      if (selectedFile) {
        const presigned = await api.getS3UploadPresignedUrl(selectedFile.name, selectedFile.type);
        fileUrl = presigned.uploadUrl;
      }

      const res = await api.submitDigitalRequest(service.serviceId, {
        ...formData,
        uploadedFile: selectedFile ? { name: selectedFile.name, url: fileUrl } : null
      });

      setResult(res);
      if (onSubmitted) onSubmitted(res);
    } catch (err) {
      alert('Error submitting digital request: ' + err.message);
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
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe2 size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                100% Digital Service Request
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Complete without standing in a physical counter queue
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

        {result ? (
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
              Digital Request Submitted!
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Tracking ID: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{result.requestId}</strong>
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
                <strong>Service:</strong> {result.serviceName}
              </div>
              <div style={{ color: '#e2e8f0', marginBottom: '0.3rem' }}>
                <strong>Estimated Processing:</strong> {result.estimatedTurnaround}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                An official digital copy with tamper-evident digital seal will be delivered to your registered campus email.
              </div>
            </div>

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              Return to Navigator
            </button>
          </div>
        ) : (
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

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Campus Email
              </label>
              <input
                type="email"
                required
                className="input-text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Request Details & Specifications
              </label>
              <textarea
                required
                className="textarea-custom"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />
            </div>

            {/* S3 Attachment */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Attach Supporting Documents (Stored on AWS S3)
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
                  id="digital-s3-file"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="digital-s3-file" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload size={22} color="#10b981" style={{ margin: '0 auto 0.4rem auto' }} />
                  <div style={{ fontSize: '0.84rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Upload Fee Clearance / Previous Grade Sheet / ID'}
                  </div>
                </label>
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
                className="btn btn-success"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Uploading & Processing...' : 'Submit Digital Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
