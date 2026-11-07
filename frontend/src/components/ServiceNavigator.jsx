import React, { useState } from 'react';
import { Search, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export default function ServiceNavigator({ query, setQuery, onSearch, intent, isSearching }) {
  const [activePrompt, setActivePrompt] = useState(query);

  const samplePrompts = [
    {
      label: "🚨 Urgent Visa Document",
      text: "I need a visa-related document urgently because my visa appointment is tomorrow morning."
    },
    {
      label: "📄 Official Transcripts",
      text: "I need my official transcript stamped and sealed for a graduate school application."
    },
    {
      label: "💳 Lost Student ID",
      text: "I lost my student ID card and need a replacement card to access my lab and dorm."
    },
    {
      label: "💰 Scholarship Hold",
      text: "Need urgent financial aid scholarship disbursement to lift registration hold."
    }
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (activePrompt.trim()) {
      setQuery(activePrompt);
      onSearch(activePrompt);
    }
  };

  const handleSelectPrompt = (promptText) => {
    setActivePrompt(promptText);
    setQuery(promptText);
    onSearch(promptText);
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto 2rem auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 999,
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <Sparkles size={14} color="#818cf8" />
          <span>Bedrock-Powered Campus Intelligence</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          What do you need help with?
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#9ca3af', lineHeight: 1.6 }}>
          Describe your request in natural language. CampusFlow identifies the correct office & counter, verifies required documents, calculates real-time wait times, and reserves emergency priority slots.
        </p>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{
          position: 'relative',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
          padding: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ paddingLeft: '1rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <Search size={22} color="#818cf8" />
          </div>
          <input
            type="text"
            value={activePrompt}
            onChange={(e) => setActivePrompt(e.target.value)}
            placeholder="e.g. I need a visa letter urgently because my interview is tomorrow..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '1.05rem',
              fontFamily: 'inherit',
              padding: '0.75rem 0.5rem'
            }}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
          >
            {isSearching ? (
              <>
                <Cpu className="animate-spin" size={18} />
                <span>Analyzing Intent...</span>
              </>
            ) : (
              <>
                <span>Find Service</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>
            Try asking:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(p.text)}
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {/* AI Intent Extraction Result Banner */}
      {intent && (
        <div style={{
          maxWidth: 840,
          margin: '1.75rem auto 0 auto',
          background: intent.isUrgent 
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(30, 41, 59, 0.8))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(30, 41, 59, 0.8))',
          border: `1px solid ${intent.isUrgent ? 'rgba(244, 63, 94, 0.35)' : 'rgba(99, 102, 241, 0.3)'}`,
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: intent.isUrgent ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {intent.isUrgent ? <ShieldAlert color="#fda4af" size={20} /> : <CheckCircle2 color="#818cf8" size={20} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                    Bedrock Structured Intent Result
                  </span>
                  <span className={`badge ${intent.isUrgent ? 'badge-emergency' : 'badge-primary'}`}>
                    {intent.isUrgent ? '⚡ High Urgency Flagged' : 'Standard Priority'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                  <strong style={{ color: '#ffffff' }}>Category:</strong> {intent.detectedCategory} &nbsp;|&nbsp; 
                  <strong style={{ color: '#ffffff' }}> Reason:</strong> {intent.urgencyReason}
                </p>
                {intent.isUrgent && (
                  <p style={{ fontSize: '0.78rem', color: '#fda4af', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={13} />
                    Emergency 2–3 slot daily quota applies. Live backend records will govern slot availability and staff verification is authoritative.
                  </p>
                )}
              </div>
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              alignSelf: 'center'
            }}>
              Model: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>anthropic.claude-3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
