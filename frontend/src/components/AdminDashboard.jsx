import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  AlertOctagon, 
  Clock, 
  BarChart3, 
  Sliders, 
  CheckCircle, 
  TrendingUp, 
  Building,
  AlertCircle,
  Inbox,
  Filter,
  CheckCheck,
  Zap,
  Activity,
  Radio,
  PenTool,
  TrendingDown,
  RefreshCw,
  Layers,
  MapPin,
  ChevronRight,
  Ticket
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalPendingOverall: 0,
    totalWaiting: 0,
    totalEmergencyToday: 0,
    pendingEmergenciesCount: 0,
    pendingProblemsCount: 0,
    activeStaffTotal: 4,
    servicesCount: 6,
    quotaStats: [],
    counterBreakdown: [],
    digitalRequestsCount: 0,
    totalProblemsCount: 0,
    recentActivity: []
  });
  const [services, setServices] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters for problem incident log
  const [problemFilterCategory, setProblemFilterCategory] = useState('ALL');
  const [problemFilterUrgency, setProblemFilterUrgency] = useState('ALL');
  const [problemFilterStatus, setProblemFilterStatus] = useState('ALL');

  const loadData = async () => {
    try {
      const data = await api.getAdminMetrics();
      const sList = await api.getServices();
      const probs = await api.getProblems();
      const acts = await api.getRecentActivity();
      
      if (data) setMetrics(data);
      if (sList && Array.isArray(sList)) setServices(sList);
      if (probs && Array.isArray(probs)) setAllProblems(probs);
      if (acts && Array.isArray(acts)) setRecentActivity(acts);
    } catch (e) {
      console.error('Error fetching admin metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    window.addEventListener('campusflow_state_changed', loadData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('campusflow_state_changed', loadData);
    };
  }, []);

  const handleUpdateQuota = async (serviceId, newLimit) => {
    await api.updateEmergencyQuota(serviceId, newLimit);
    loadData();
  };

  const handleAdminResolveProblem = async (problemId) => {
    await api.updateProblemStatus(problemId, 'RESOLVED', 'Resolved via Campus Operations Admin override.');
    loadData();
  };

  const handleAdminCompleteTicket = async (ticketId) => {
    await api.completeTicket(ticketId, 'ADMIN_COMPLETED_AND_STAMPED');
    loadData();
  };

  const filteredProblems = (allProblems || []).filter(p => {
    if (!p) return false;
    if (problemFilterCategory !== 'ALL' && p.category !== problemFilterCategory) return false;
    if (problemFilterUrgency === 'URGENT_ONLY' && !p.isUrgent) return false;
    if (problemFilterStatus !== 'ALL' && p.status !== problemFilterStatus) return false;
    return true;
  });

  const urgentCount = (allProblems || []).filter(p => p && p.isUrgent && p.status !== 'RESOLVED').length;

  return (
    <div>
      {/* Top Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">
            <ShieldCheck size={14} /> Campus Admin Control
          </span>
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Radio size={12} className="animate-pulse" /> Live Multi-Portal Broadcast Active
          </span>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
          Executive Operations & Real-Time Demand Command Center
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Real-time synchronized visibility into total pending students, counter queues, signatures, and emergency quotas.
        </p>
      </div>

      {/* PROMINENT KPI STATS GRID WITH LIVE PENDING PEOPLE COUNT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* CARD 1: TOTAL PENDING STUDENTS (PRIMARY KPI) */}
        <div className="glass-card" style={{
          padding: '1.35rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                🔴 Total Pending Students
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', marginTop: '0.2rem', lineHeight: 1 }}>
                {metrics?.totalPendingOverall || metrics?.totalWaiting || 0}
              </div>
            </div>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.25)', color: '#fda4af' }}>
              <Clock size={26} />
            </div>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#fecdd3', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Across walk-in queues & inquiries</span>
          </div>
        </div>

        {/* CARD 2: WAITING IN WALK-IN QUEUES */}
        <div className="glass-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                In Walk-in Queues
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem', lineHeight: 1 }}>
                {metrics?.totalWaiting || 0}
              </div>
            </div>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Users size={24} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <TrendingUp size={13} /> Across 6 Campus Counters
          </div>
        </div>

        {/* CARD 3: PENDING EMERGENCY REQUESTS */}
        <div className="glass-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                Emergency Cases Today
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fda4af', marginTop: '0.2rem', lineHeight: 1 }}>
                {metrics?.totalEmergencyToday || 0}
              </div>
            </div>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af' }}>
              <AlertOctagon size={24} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fda4af', marginTop: '0.75rem' }}>
            Strict 2–3 Quota Enforced
          </div>
        </div>

        {/* CARD 4: ACTIVE DUTY STAFF */}
        <div className="glass-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
                Active Duty Desks
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem', lineHeight: 1 }}>
                {metrics?.activeStaffTotal || 4}
              </div>
            </div>
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Building size={24} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
            Full campus coverage
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION: LIVE PENDING QUEUES & STUDENTS BY COUNTER DESK */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={22} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Live Pending Students & Queue Load by Counter
              </h3>
              <span style={{ fontSize: '0.76rem', color: '#9ca3af' }}>
                Detailed visibility into waiting student counts, estimated wait times, and duty officers for every service desk.
              </span>
            </div>
          </div>

          <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            {metrics?.totalWaiting || 0} Students Currently In Line
          </span>
        </div>

        {/* Counter Grid Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem'
        }}>
          {(metrics?.counterBreakdown || []).map((cb) => (
            <div
              key={cb.serviceId}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: cb.queuePending > 0 ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '1.15rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                <div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    textTransform: 'uppercase'
                  }}>
                    {cb.counter}
                  </span>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0 0 0' }}>
                    {cb.name}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {cb.office}
                  </div>
                </div>

                <div style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  background: cb.queuePending > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  color: cb.queuePending > 0 ? '#fda4af' : '#34d399',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  textAlign: 'center'
                }}>
                  {cb.queuePending} Pending
                </div>
              </div>

              {/* Waiting Students Pill List */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '0.75rem',
                borderRadius: '10px',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Students Waiting In Line ({cb.waitingStudents?.length || 0}):
                </div>
                {(!cb.waitingStudents || cb.waitingStudents.length === 0) ? (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                    No students currently waiting at this counter.
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {cb.waitingStudents.map((ws, wIdx) => (
                      <div
                        key={ws.ticketId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          background: 'rgba(30, 41, 59, 0.6)',
                          padding: '0.35rem 0.55rem',
                          borderRadius: '6px',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontWeight: 800, color: ws.isEmergency ? '#fda4af' : '#38bdf8', flexShrink: 0 }}>
                            {ws.ticketId}
                          </span>
                          <span style={{ color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ws.studentName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                            ~{ws.waitMins}m
                          </span>
                          <button
                            onClick={() => handleAdminCompleteTicket(ws.ticketId)}
                            title="Mark service & signature completed"
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34d399',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <CheckCircle size={11} /> Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Officer & Wait Time Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.76rem',
                color: '#9ca3af',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '0.5rem'
              }}>
                <div>
                  Duty Officer: <strong style={{ color: '#e2e8f0' }}>{cb.staffName}</strong>
                </div>
                <div style={{ color: '#38bdf8', fontWeight: 700 }}>
                  Est. Wait: ~{cb.estimatedWaitMinutes} mins
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE CAMPUS BROADCAST ACTIVITY STREAM */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Live Real-Time Activity & Signature Stream
            </h3>
          </div>
          <span style={{ fontSize: '0.76rem', color: '#34d399' }}>
            Updating automatically on every student & staff event
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '190px',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          {(recentActivity || []).length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', padding: '0.5rem 0' }}>
              No recent campus activity recorded yet.
            </div>
          ) : (
            (recentActivity || []).map((act, idx) => (
              <div
                key={act.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  background: act.type === 'SIGNATURE_COMPLETED' 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : act.type === 'EMERGENCY' 
                    ? 'rgba(244, 63, 94, 0.15)' 
                    : 'rgba(15, 23, 42, 0.6)',
                  border: act.type === 'SIGNATURE_COMPLETED' 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : act.type === 'EMERGENCY' 
                    ? '1px solid rgba(244, 63, 94, 0.3)' 
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.84rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {act.type === 'SIGNATURE_COMPLETED' ? (
                    <PenTool size={15} color="#34d399" />
                  ) : act.type === 'EMERGENCY' ? (
                    <AlertOctagon size={15} color="#fda4af" />
                  ) : (
                    <Activity size={15} color="#818cf8" />
                  )}
                  <span style={{ color: act.type === 'SIGNATURE_COMPLETED' ? '#ffffff' : '#cbd5e1', fontWeight: act.type === 'SIGNATURE_COMPLETED' ? 700 : 400 }}>
                    {act.text}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {act.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 1: LIVE CAMPUS STUDENT PROBLEMS & ESCALATIONS FEED */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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
              <Inbox size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Live Campus Student Problem & Inquiry Incident Log
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Real-time synchronized student requests across Registrar, International, Bursar, Security & Health
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="select-custom"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', minWidth: 130 }}
              value={problemFilterCategory}
              onChange={(e) => setProblemFilterCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="International Students">International</option>
              <option value="Academic Records">Academic / Registrar</option>
              <option value="Financial Aid">Financial Aid / Bursar</option>
              <option value="Campus Security & Cards">ID / Security</option>
              <option value="Health & Wellness">Health</option>
            </select>

            <select
              className="select-custom"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', minWidth: 120 }}
              value={problemFilterUrgency}
              onChange={(e) => setProblemFilterUrgency(e.target.value)}
            >
              <option value="ALL">All Urgency</option>
              <option value="URGENT_ONLY">🚨 Urgent Only</option>
            </select>

            <select
              className="select-custom"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', minWidth: 120 }}
              value={problemFilterStatus}
              onChange={(e) => setProblemFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Problems List Table / Cards */}
        {filteredProblems.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            No student problems match the selected filter criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredProblems.map((prob) => (
              <div
                key={prob.problemId}
                style={{
                  background: prob.isUrgent ? 'rgba(30, 15, 25, 0.6)' : 'rgba(15, 23, 42, 0.6)',
                  border: prob.isUrgent ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '1.15rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span className={`badge ${prob.isUrgent ? 'badge-emergency' : 'badge-primary'}`} style={{ fontSize: '0.68rem' }}>
                        {prob.isUrgent ? 'URGENT' : 'STANDARD'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>
                        {prob.category}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        • Ref: {prob.problemId}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: 700, margin: 0 }}>
                      {prob.title}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                      Student: <strong>{prob.studentName}</strong> ({prob.studentId}) &nbsp;|&nbsp; {prob.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: prob.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : prob.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: prob.status === 'RESOLVED' ? '#34d399' : prob.status === 'IN_PROGRESS' ? '#38bdf8' : '#fbbf24',
                      fontWeight: 700
                    }}>
                      {prob.status}
                    </span>

                    {prob.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleAdminResolveProblem(prob.problemId)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '0.25rem 0.6rem' }}
                      >
                        <CheckCheck size={12} />
                        Admin Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#94a3af', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {prob.description}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                  color: '#64748b',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  paddingTop: '0.45rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    Assigned Desk: <strong style={{ color: '#38bdf8' }}>{prob.assignedCounter}</strong> (Staff: {prob.assignedStaff})
                  </div>
                  {prob.staffNotes && (
                    <div style={{ color: '#e2e8f0' }}>
                      <strong>Latest Staff Note:</strong> "{prob.staffNotes}"
                    </div>
                  )}
                  <div>
                    Logged {new Date(prob.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: EMERGENCY QUOTA CONFIGURATION MATRIX */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="#fda4af" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Regulated Emergency Quota Allocator
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
            Default Policy: <strong>2 to 3 slots per service/day</strong> to prevent queue starvation.
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Campus Service</th>
                <th style={{ padding: '0.75rem 1rem' }}>Designated Counter</th>
                <th style={{ padding: '0.75rem 1rem' }}>Daily Quota Limit</th>
                <th style={{ padding: '0.75rem 1rem' }}>Slots Used Today</th>
                <th style={{ padding: '0.75rem 1rem' }}>Remaining Slots</th>
                <th style={{ padding: '0.75rem 1rem' }}>Live Pending Students</th>
              </tr>
            </thead>
            <tbody>
              {(services || []).map((svc) => {
                const limit = svc.emergencyQuotaPerDay || 3;
                const used = svc.emergencySlotsUsedToday || 0;
                const remaining = Math.max(0, limit - used);

                return (
                  <tr key={svc.serviceId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#ffffff' }}>
                      {svc.name}
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>{svc.category}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#38bdf8' }}>
                      {svc.counter}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={limit}
                          onChange={(e) => handleUpdateQuota(svc.serviceId, e.target.value)}
                          style={{
                            width: 60,
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            padding: '0.3rem 0.5rem',
                            fontWeight: 700,
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>slots/day</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: used > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: used > 0 ? '#fda4af' : '#9ca3af',
                        fontWeight: 700
                      }}>
                        {used} / {limit}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        color: remaining > 0 ? '#34d399' : '#f87171',
                        fontWeight: 700
                      }}>
                        {remaining} available
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                      <strong style={{ color: '#38bdf8' }}>{svc.currentQueueCount || svc.currentQueueLength || 0}</strong> waiting (~{svc.estimatedWaitTime || 10}m)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
