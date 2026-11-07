import React, { useState } from 'react';
import { FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react';

export default function DocumentChecklist({ documents = [], isEmergency = false }) {
  const [checkedDocs, setCheckedDocs] = useState({});

  const toggleDoc = (doc) => {
    setCheckedDocs(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const totalCount = documents.length;
  const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '1rem',
      marginTop: '1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={16} color="#818cf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
            Required Documents Checklist
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: checkedCount === totalCount && totalCount > 0 ? '#34d399' : '#94a3b8',
          fontWeight: 600
        }}>
          {checkedCount}/{totalCount} Ready
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {documents.map((doc, idx) => {
          const isChecked = !!checkedDocs[doc];
          const isSpecialProof = doc.toLowerCase().includes('emergency') || doc.toLowerCase().includes('proof');

          return (
            <div
              key={idx}
              onClick={() => toggleDoc(doc)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '8px',
                background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ marginTop: 2 }}>
                {isChecked ? (
                  <CheckCircle size={15} color="#10b981" />
                ) : (
                  <Circle size={15} color="#64748b" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.82rem',
                  color: isChecked ? '#ffffff' : '#cbd5e1',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  fontWeight: isSpecialProof ? 600 : 400
                }}>
                  {doc}
                </div>
                {isSpecialProof && (
                  <span style={{
                    fontSize: '0.68rem',
                    color: '#fda4af',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    marginTop: '0.15rem'
                  }}>
                    <AlertCircle size={10} /> Mandatory for priority validation
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
