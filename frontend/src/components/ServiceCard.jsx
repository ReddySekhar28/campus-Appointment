import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Clock, 
  Users, 
  Calendar, 
  FileCheck, 
  AlertOctagon, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Globe2 
} from 'lucide-react';
import DocumentChecklist from './DocumentChecklist';

export default function ServiceCard({
  service,
  onJoinQueue,
  onOpenEmergencyModal,
  onOpenAppointmentModal,
  onOpenDigitalModal
}) {
  const [showDocs, setShowDocs] = useState(false);

  const quotaLimit = service.emergencyQuotaPerDay || 3;
  const quotaUsed = service.emergencySlotsUsedToday || 0;
  const quotaAvailable = quotaLimit - quotaUsed > 0;

  return (
    <div className="glass-card glass-card-interactive" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Header & Badges */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
              {service.category}
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
              {service.name}
            </h3>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '0.3rem 0.65rem',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <Clock size={14} />
              <span>~{service.estimatedWaitTime || service.avgDurationMinutes || 10} min wait</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.86rem', color: '#9ca3af', marginBottom: '1rem', lineHeight: 1.5 }}>
          {service.description}
        </p>

        {/* Location & Operational Facts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '0.85rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Building2 size={16} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Office Location
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                {service.office}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Layers size={16} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Designated Counter
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                {service.counter}
              </div>
            </div>
          </div>
        </div>

        {/* Queue Metrics & Emergency Quota Meter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.4)',
          padding: '0.75rem 0.85rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
            <Users size={14} color="#38bdf8" />
            <span>Active Queue: <strong>{service.currentQueueCount || service.currentQueueLength} in line</strong></span>
          </div>

          {/* 2-3 Slot Emergency Quota Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Emergency Quota:</span>
            <span style={{
              fontWeight: 700,
              color: quotaAvailable ? '#f43f5e' : '#64748b',
              background: quotaAvailable ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              border: `1px solid ${quotaAvailable ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}>
              {quotaUsed}/{quotaLimit} Used Today
            </span>
          </div>
        </div>

        {/* Toggle Document Checklist */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowDocs(!showDocs)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <FileCheck size={14} />
            <span>{showDocs ? 'Hide Required Documents' : `View ${service.requiredDocuments?.length || 0} Required Documents`}</span>
            {showDocs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDocs && (
            <DocumentChecklist documents={service.requiredDocuments} />
          )}
        </div>
      </div>

      {/* Action Buttons Hub */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => onJoinQueue(service)}
            className="btn btn-primary btn-sm"
          >
            <Zap size={14} />
            <span>Join Live Queue</span>
          </button>

          {service.allowAppointment ? (
            <button
              onClick={() => onOpenAppointmentModal(service)}
              className="btn btn-secondary btn-sm"
            >
              <Calendar size={14} />
              <span>Book Slot</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenDigitalModal(service)}
              className="btn btn-secondary btn-sm"
            >
              <Globe2 size={14} />
              <span>Digital Form</span>
            </button>
          )}
        </div>

        {/* Protected Emergency Quota Trigger */}
        <button
          onClick={() => onOpenEmergencyModal(service)}
          className={`btn btn-sm ${quotaAvailable ? 'btn-emergency' : 'btn-secondary'}`}
          style={{ width: '100%', fontSize: '0.82rem' }}
          disabled={!quotaAvailable}
        >
          <AlertOctagon size={14} />
          <span>
            {quotaAvailable 
              ? `Apply Emergency Priority (${quotaLimit - quotaUsed} slots left)` 
              : `Emergency Quota Full for Today (${quotaLimit}/${quotaLimit})`}
          </span>
        </button>
      </div>
    </div>
  );
}
