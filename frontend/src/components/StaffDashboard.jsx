import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertOctagon, 
  CheckCircle, 
  XCircle, 
  PhoneCall, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Activity,
  MessageSquare,
  Send,
  AlertCircle,
  Sparkles,
  Inbox,
  PenTool,
  TrendingDown,
  FileCheck2,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export default function StaffDashboard() {
  const [selectedServiceId, setSelectedServiceId] = useState('SRV-INT-001');
  const [services, setServices] = useState([]);
  const [queuesData, setQueuesData] = useState({ normalQueue: [], emergencyQueue: [], pendingEmergencies: [], deptProblems: [] });
  const [staffStatus, setStaffStatus] = useState('AVAILABLE');
  const [activeTab, setActiveTab] = useState('normal'); // 'normal', 'emergency', 'problems'
  const [staffNoteInputs, setStaffNoteInputs] = useState({});
  const [lastCompletedTicket, setLastCompletedTicket] = useState(null);

  const loadData = async () => {
    const sList = await api.getServices();
    setServices(sList);
    const qData = await api.getStaffQueues(selectedServiceId);
    setQueuesData(qData);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    window.addEventListener('campusflow_state_changed', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('campusflow_state_changed', loadData);
    };
  }, [selectedServiceId]);

  const handleCallTicket = async (ticketId) => {
    await api.callNextTicket(ticketId);
    loadData();
  };

  // Signature Completed & Stamped -> Recalculates and Reduces Wait Time for Everyone Else
  const handleSignatureCompleted = async (ticketId, isEmergency = false) => {
    const completedTicket = await api.completeTicket(ticketId, "SIGNATURE_COMPLETED_AND_STAMPED");
    setLastCompletedTicket(completedTicket);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
    loadData();
  };

  const handleReviewEmergency = async (emergencyId, approved) => {
    await api.reviewEmergencyRequest(emergencyId, approved);
    loadData();
  };

  const handleUpdateProblem = async (problemId, newStatus, resolution = null) => {
    const note = staffNoteInputs[problemId] || null;
    await api.updateProblemStatus(problemId, newStatus, note, resolution);
    if (newStatus === 'RESOLVED') {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
    loadData();
  };

  const activeService = services.find(s => s.serviceId === selectedServiceId);
  const currentlyServing = queuesData.normalQueue.find(q => q.status === 'IN_PROGRESS') || queuesData.emergencyQueue.find(q => q.status === 'IN_PROGRESS');

  return (
    <div>
      {/* Top Staff Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
              Staff Counter Assignment
            </div>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="select-custom"
              style={{ minWidth: 280, marginTop: '0.25rem' }}
            >
              {services.map(s => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.counter} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
              Operating Desk
            </div>
            <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700, marginTop: '0.35rem' }}>
              {activeService?.office || 'Administration Building'}
            </div>
          </div>
        </div>

        {/* Staff Duty Status Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Counter Duty:</span>
          <button
            onClick={() => setStaffStatus(staffStatus === 'AVAILABLE' ? 'ON_BREAK' : 'AVAILABLE')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '999px',
              border: `1px solid ${staffStatus === 'AVAILABLE' ? '#10b981' : '#f59e0b'}`,
              background: staffStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: staffStatus === 'AVAILABLE' ? '#34d399' : '#fbbf24',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Activity size={14} />
            <span>{staffStatus === 'AVAILABLE' ? 'COUNTER ACTIVE' : 'ON BREAK'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Wait Time Reduction Highlight Notification Banner */}
      {lastCompletedTicket && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingDown size={22} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                ✍️ Signature Completed for Ticket [{lastCompletedTicket.ticketId}] ({lastCompletedTicket.studentName})!
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6ee7b7' }}>
                Live Queue Updated: Estimated wait time dynamically reduced by ~{activeService?.avgDurationMinutes || 10} mins for remaining waiting students.
              </div>
            </div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
            Queue Advanced Forward
          </span>
        </div>
      )}

      {/* Active Serving Desk Action Card if currently serving someone */}
      {currentlyServing && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(99, 102, 241, 0.5)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 0 25px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#ffffff'
            }}>
              🎯
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span className="badge badge-primary">Currently at Counter Desk</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8' }}>
                  {currentlyServing.ticketId}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                {currentlyServing.studentName} ({currentlyServing.studentId})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Service: {currentlyServing.serviceName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Direct Signature Completed Action */}
            <button
              onClick={() => handleSignatureCompleted(currentlyServing.ticketId)}
              className="btn btn-success"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
            >
              <PenTool size={16} />
              <span>✍️ Signature Completed & Stamp Issued (Reduces Line Wait Time)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Main Staff Workspace Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Normal Queue Tab */}
        <button
          onClick={() => setActiveTab('normal')}
          style={{
            padding: '0.7rem 1.25rem',
            borderRadius: '12px',
            background: activeTab === 'normal' ? 'linear-gradient(135deg, #6366f1, #4338ca)' : 'rgba(30, 41, 59, 0.5)',
            border: activeTab === 'normal' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} />
          <span>Standard Walk-in Queue ({queuesData.normalQueue.length})</span>
        </button>

        {/* Emergency Queue Tab */}
        <button
          onClick={() => setActiveTab('emergency')}
          style={{
            padding: '0.7rem 1.25rem',
            borderRadius: '12px',
            background: activeTab === 'emergency' ? 'linear-gradient(135deg, #e11d48, #9f1239)' : 'rgba(30, 41, 59, 0.5)',
            border: activeTab === 'emergency' ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertOctagon size={18} />
          <span>Priority Emergency Queue ({queuesData.pendingEmergencies.length})</span>
        </button>

        {/* Student Problems Tab */}
        <button
          onClick={() => setActiveTab('problems')}
          style={{
            padding: '0.7rem 1.25rem',
            borderRadius: '12px',
            background: activeTab === 'problems' ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(30, 41, 59, 0.5)',
            border: activeTab === 'problems' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Inbox size={18} />
          <span>Student Problems & Inquiries ({queuesData.deptProblems?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: NORMAL WALK-IN QUEUE */}
      {activeTab === 'normal' && (
        <div>
          {queuesData.normalQueue.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <Users size={42} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                Standard Queue is Empty
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                No walk-in students waiting for {activeService?.name}. When a student enters on the student hub, their ticket will appear here instantly.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {queuesData.normalQueue.map((ticket, idx) => (
                <div
                  key={ticket.ticketId}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    border: ticket.status === 'IN_PROGRESS' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: ticket.status === 'IN_PROGRESS' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#a5b4fc',
                      fontSize: '1rem'
                    }}>
                      #{ticket.position || idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                          {ticket.ticketId}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: ticket.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: ticket.status === 'IN_PROGRESS' ? '#38bdf8' : '#9ca3af',
                          fontWeight: 700
                        }}>
                          {ticket.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>
                          ~{ticket.estimatedWaitMinutes}m wait
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {ticket.studentName} ({ticket.studentId})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ticket.status !== 'IN_PROGRESS' ? (
                      <button
                        onClick={() => handleCallTicket(ticket.ticketId)}
                        className="btn btn-primary btn-sm"
                      >
                        <PhoneCall size={14} />
                        Call to Desk
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSignatureCompleted(ticket.ticketId)}
                        className="btn btn-success btn-sm"
                        style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                      >
                        <PenTool size={14} />
                        ✍️ Signature Completed & Stamp Issued
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMERGENCY QUEUE */}
      {activeTab === 'emergency' && (
        <div>
          {queuesData.pendingEmergencies.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <ShieldCheck size={42} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                No Pending Emergency Requests
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                All protected quota requests for {activeService?.name} have been processed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {queuesData.pendingEmergencies.map((emg) => (
                <div
                  key={emg.emergencyId}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    background: 'rgba(30, 15, 25, 0.65)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="badge badge-emergency">
                          Emergency Slot #{emg.allocatedSlotIndex || 1}
                        </span>
                        <h4 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                          {emg.studentName} ({emg.studentId})
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#fda4af', fontFamily: 'monospace', fontWeight: 700 }}>
                          Ticket: {emg.ticketId}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                        Deadline Claimed: <strong style={{ color: '#ffffff' }}>{emg.deadline}</strong> &nbsp;|&nbsp; Contact: {emg.email}
                      </div>
                    </div>

                    <div style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      background: emg.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: emg.status === 'APPROVED' ? '#34d399' : '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      Status: {emg.status}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                    fontSize: '0.88rem',
                    color: '#f1f5f9'
                  }}>
                    <strong style={{ color: '#fda4af' }}>Student Stated Reason:</strong> "{emg.reason}"
                  </div>

                  {emg.supportingDocName && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      marginBottom: '1.25rem'
                    }}>
                      <FileText size={15} />
                      <span>Attached S3 Document: <strong>{emg.supportingDocName}</strong></span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {emg.status === 'PENDING_STAFF_APPROVAL' && (
                      <>
                        <button
                          onClick={() => handleReviewEmergency(emg.emergencyId, false)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#f87171' }}
                        >
                          <XCircle size={15} />
                          Reject Priority (Move to Normal)
                        </button>
                        <button
                          onClick={() => handleReviewEmergency(emg.emergencyId, true)}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle size={15} />
                          Approve Priority Slot
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleCallTicket(emg.ticketId)}
                      className="btn btn-emergency btn-sm"
                    >
                      <PhoneCall size={15} />
                      Call Emergency Student to Desk
                    </button>

                    <button
                      onClick={() => handleSignatureCompleted(emg.ticketId, true)}
                      className="btn btn-success btn-sm"
                      style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                    >
                      <PenTool size={14} />
                      ✍️ Signature Completed & Stamped
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT PROBLEMS & INQUIRIES */}
      {activeTab === 'problems' && (
        <div>
          {(!queuesData.deptProblems || queuesData.deptProblems.length === 0) ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <CheckCircle size={42} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.3rem' }}>
                All Student Inquiries Resolved
              </h4>
              <p style={{ fontSize: '0.85rem' }}>
                No active student problems logged for {activeService?.name}.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {queuesData.deptProblems.map((prob) => (
                <div
                  key={prob.problemId}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    border: prob.isUrgent ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: prob.isUrgent ? 'rgba(30, 15, 25, 0.7)' : 'rgba(31, 41, 55, 0.7)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span className={`badge ${prob.isUrgent ? 'badge-emergency' : 'badge-primary'}`}>
                          {prob.isUrgent ? '🚨 URGENT ISSUE' : 'STANDARD INQUIRY'}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: prob.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : prob.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: prob.status === 'RESOLVED' ? '#34d399' : prob.status === 'IN_PROGRESS' ? '#38bdf8' : '#fbbf24',
                          fontWeight: 700
                        }}>
                          STATUS: {prob.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                          Ref: {prob.problemId}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: 800, margin: 0 }}>
                        {prob.title}
                      </h4>
                      <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        Student: <strong style={{ color: '#ffffff' }}>{prob.studentName}</strong> ({prob.studentId}) &nbsp;|&nbsp; {prob.email}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                      Logged {new Date(prob.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#e2e8f0',
                    lineHeight: 1.5
                  }}>
                    {prob.description}
                  </div>

                  {prob.isUrgent && prob.urgencyReason && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#fda4af',
                      background: 'rgba(244, 63, 94, 0.1)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <AlertCircle size={14} />
                      <span><strong>Urgency Justification:</strong> {prob.urgencyReason}</span>
                    </div>
                  )}

                  {prob.supportingDocName && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: '#38bdf8',
                      marginBottom: '1rem'
                    }}>
                      <FileText size={15} />
                      <span>Attached Evidence: <strong>{prob.supportingDocName}</strong></span>
                    </div>
                  )}

                  {/* Staff Notes / Response input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Staff Counter Response & Internal Notes
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="input-text"
                        style={{ fontSize: '0.84rem' }}
                        placeholder="Add staff response or update status for student and admin..."
                        value={staffNoteInputs[prob.problemId] !== undefined ? staffNoteInputs[prob.problemId] : (prob.staffNotes || '')}
                        onChange={(e) => setStaffNoteInputs({ ...staffNoteInputs, [prob.problemId]: e.target.value })}
                      />
                      <button
                        onClick={() => handleUpdateProblem(prob.problemId, prob.status)}
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <Send size={14} />
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Staff Action Resolution Buttons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                      Assigned Officer: <strong style={{ color: '#38bdf8' }}>{prob.assignedStaff || 'Desk 4 Officer'}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {prob.status !== 'IN_PROGRESS' && prob.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateProblem(prob.problemId, 'IN_PROGRESS')}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#38bdf8' }}
                        >
                          Mark In Progress
                        </button>
                      )}

                      {prob.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateProblem(prob.problemId, 'RESOLVED', 'Issue verified, required stamp/document issued at desk.')}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCheck size={14} />
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
