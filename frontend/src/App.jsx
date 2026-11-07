import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ServiceNavigator from './components/ServiceNavigator';
import ServiceCard from './components/ServiceCard';
import QueueTracker from './components/QueueTracker';
import EmergencyModal from './components/EmergencyModal';
import AppointmentModal from './components/AppointmentModal';
import DigitalRequestModal from './components/DigitalRequestModal';
import StudentProblemModal from './components/StudentProblemModal';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';
import LoginPortal from './components/LoginPortal';
import { api } from './services/api';
import confetti from 'canvas-confetti';
import {
  INITIAL_SERVICES,
  INITIAL_STAFF,
  INITIAL_QUEUES,
  INITIAL_EMERGENCY_REQUESTS,
  INITIAL_PROBLEMS
} from './services/mockData';

import { supabase } from './lib/supabase';
import { 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Sparkles, 
  Bell, 
  Layers, 
  CheckCircle2, 
  UserCheck,
  AlertCircle,
  PlusCircle,
  Clock,
  MessageSquare,
  FileText,
  Zap,
  Inbox
} from 'lucide-react';

export default function App() {
  // Authentication State: no automatic demo login
const [currentUser, setCurrentUser] = useState(null);
const [isLoginOpen, setIsLoginOpen] = useState(true);

// Default portal selection; access requires authentication
const [activeRole, setActiveRole] = useState('student');


  const [query, setQuery] = useState('');
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [extractedIntent, setExtractedIntent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [studentProblems, setStudentProblems] = useState([]);

  // Modals state
  const [emergencyModalService, setEmergencyModalService] = useState(null);
  const [appointmentModalService, setAppointmentModalService] = useState(null);
  const [digitalModalService, setDigitalModalService] = useState(null);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);

  // Seamless 1-Click Role Navigation: instantly switches view and authorized demo identity
  // Restore and monitor the authenticated Supabase session
useEffect(() => {
  let mounted = true;

  const applySession = (session) => {
    const authUser = session?.user;

    if (!authUser) {
      setCurrentUser(null);
      setIsLoginOpen(true);
      setActiveRole('student');
      return false;
    }

    const email = (authUser.email || '').toLowerCase();
    const role = authUser.app_metadata?.role;
    const isConfirmed = Boolean(
      authUser.email_confirmed_at || authUser.confirmed_at
    );

    if (
      !email.endsWith('@klu.ac.in') ||
      !isConfirmed ||
      !['student', 'teacher', 'admin'].includes(role)
    ) {
      setCurrentUser(null);
      setIsLoginOpen(true);
      setActiveRole('student');
      return false;
    }

    const user = {
      id: authUser.id,
      email,
      name: authUser.user_metadata?.full_name || email.split('@')[0],
      role: role === 'teacher' ? 'staff' : role
    };

    setCurrentUser(user);
    setActiveRole(user.role);
    setIsLoginOpen(false);

    return true;
  };

  const restoreSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (!mounted) return;

    if (error) {
      console.error('Session restoration failed:', error);
      applySession(null);
      return;
    }

    const valid = applySession(data.session);

    if (data.session && !valid) {
      await supabase.auth.signOut();
    }
  };

  restoreSession();

  
const {
  data: { subscription }
} = supabase.auth.onAuthStateChange((event, session) => {
  if (!mounted) return;

  // LoginPortal handles successful login only after checking the selected role.
  // Prevent premature dashboard navigation during authentication.
  if (event === 'SIGNED_IN') return;

  applySession(session);
});


  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

// Handle successful login
const handleLoginSuccess = (user) => {
  setCurrentUser(user);
  setActiveRole(user.role);
  setIsLoginOpen(false);

  confetti({
    particleCount: 60,
    spread: 60,
    origin: { y: 0.7 }
  });
};

// Sign out from Supabase
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Supabase logout failed:', error);
    return;
  }

  setCurrentUser(null);
  setActiveRole('student');
  setIsLoginOpen(true);
};

  // Fetch initial services & problems
  const loadInitialData = async () => {
    const sList = await api.getServices();
    setServices(sList || []);
    setFilteredServices(sList || []);
    
    // Load student's submitted problems
    const probs = await api.getProblems();
    if (currentUser && currentUser.role === 'student') {
      setStudentProblems((probs || []).filter(p => p.studentId === currentUser.studentId || p.email === currentUser.email));
    } else {
      setStudentProblems(probs || []);
    }
  };

  useEffect(() => {
    loadInitialData();
    window.addEventListener('campusflow_state_changed', loadInitialData);
    return () => window.removeEventListener('campusflow_state_changed', loadInitialData);
  }, [currentUser]);

  // Handle Search Navigator
  const handleSearch = async (searchQuery) => {
    if (!searchQuery) {
      setFilteredServices(services);
      setExtractedIntent(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.searchNavigator(searchQuery, currentUser?.name || 'Student');
      setExtractedIntent(res.intent);
      setFilteredServices(res.matches);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearching(false);
    }
  };

 
  

  // Join Normal Queue
  const handleJoinQueue = async (service) => {
    try {
      const sName = currentUser?.name || prompt('Enter your student name:', 'Jordan Lee') || 'Jordan Lee';
      const sId = currentUser?.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;

      const ticket = await api.joinQueue(service.serviceId, {
        name: sName,
        studentId: sId
      });
      setActiveTicket(ticket);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      loadInitialData();
    } catch (err) {
      alert('Failed to join queue: ' + err.message);
    }
  };

  // Emergency priority reserved
  const handleEmergencySuccess = (ticket) => {
    setActiveTicket(ticket);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
    loadInitialData();
  };

  // Problem submitted
  const handleProblemSubmitted = (problem) => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    loadInitialData();
  };

  // Reset demo state
  const handleResetData = () => {
    if (window.confirm('Reset all demo queues, emergency slots, and appointments to clean baseline?')) {
      api.resetDemoData();
    }
  };
  // Password recovery page
if (window.location.pathname === '/reset-password') {
  return <ResetPassword />;
}

  // If user is logged out -> Render the Front Login Page
  // Require authentication before showing the application
if (!currentUser) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <LoginPortal
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
    
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        activeRole={activeRole}
        
        onResetData={handleResetData}
      />

      <main className="app-container" style={{ flex: 1, paddingTop: '1.75rem' }}>
        {/* Personalized Welcome Banner */}
        {currentUser && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: activeRole === 'student' 
                  ? 'rgba(99, 102, 241, 0.2)' 
                  : activeRole === 'staff' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {currentUser.avatar || '👤'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                    Welcome back, {currentUser.name}
                  </span>
                  <span className={`badge ${currentUser.role === 'student' ? 'badge-primary' : currentUser.role === 'staff' ? 'badge-success' : 'badge-emergency'}`}>
                    {currentUser.role === 'student' ? 'Student Account' : currentUser.role === 'staff' ? 'Faculty / Staff Desk' : 'Campus Administrator'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                  {currentUser.email} &nbsp;|&nbsp; 
                  <strong style={{ color: '#e2e8f0' }}> {currentUser.department || 'Academic Division'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {activeRole === 'student' && (
                <button
                  onClick={() => setIsProblemModalOpen(true)}
                  className="btn btn-emergency btn-sm"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                >
                  <PlusCircle size={15} />
                  <span>Report Campus Problem / Inquiry</span>
                </button>
              )}

              <button
                onClick={() => setIsLoginOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem' }}
              >
                <UserCheck size={14} />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {/* STUDENT PORTAL */}
        {activeRole === 'student' && (
          <div>
            {/* Active Ticket Banner */}
            {activeTicket && (
              <QueueTracker
                ticket={activeTicket}
                onDismiss={() => setActiveTicket(null)}
              />
            )}

            {/* Smart Search Hero */}
            <ServiceNavigator
              query={query}
              setQuery={setQuery}
              onSearch={handleSearch}
              intent={extractedIntent}
              isSearching={isSearching}
            />

            {/* Student's Active Submitted Inquiries Feed */}
            {studentProblems.length > 0 && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Inbox size={18} color="#38bdf8" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      My Active Reported Problems & Inquiries ({studentProblems.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Zap size={13} /> Live Synced with Staff Desks
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {studentProblems.map((prob) => (
                    <div
                      key={prob.problemId}
                      style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: prob.isUrgent ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span className={`badge ${prob.isUrgent ? 'badge-emergency' : 'badge-primary'}`} style={{ fontSize: '0.66rem' }}>
                              {prob.isUrgent ? 'URGENT' : 'STANDARD'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                              {prob.assignedCounter}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              • Ref: {prob.problemId}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                            {prob.title}
                          </h4>
                        </div>

                        <div style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: prob.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : prob.status === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: prob.status === 'RESOLVED' ? '#34d399' : prob.status === 'IN_PROGRESS' ? '#38bdf8' : '#fbbf24',
                          fontWeight: 700
                        }}>
                          STATUS: {prob.status}
                        </div>
                      </div>

                      <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: '0.35rem 0 0.5rem 0', lineHeight: 1.4 }}>
                        {prob.description}
                      </p>

                      {prob.staffNotes && (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <MessageSquare size={13} color="#38bdf8" />
                          <span><strong>Officer Response:</strong> "{prob.staffNotes}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Directory Section */}
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {extractedIntent ? 'Recommended Campus Services' : 'All Verified Campus Services & Counters'}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    Authoritative operational data retrieved from verified campus directories.
                  </p>
                </div>

                {extractedIntent && (
                  <button
                    onClick={() => {
                      setQuery('');
                      setExtractedIntent(null);
                      setFilteredServices(services);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Service Cards Grid */}
              <div className="grid-2">
                {filteredServices.map(service => (
                  <ServiceCard
                    key={service.serviceId}
                    service={service}
                    onJoinQueue={handleJoinQueue}
                    onOpenEmergencyModal={(svc) => setEmergencyModalService(svc)}
                    onOpenAppointmentModal={(svc) => setAppointmentModalService(svc)}
                    onOpenDigitalModal={(svc) => setDigitalModalService(svc)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACULTY / STAFF PORTAL */}
        {activeRole === 'staff' && <StaffDashboard />}

        {/* ADMIN PORTAL */}
        {activeRole === 'admin' && <AdminDashboard />}
      </main>

      {/* MODALS */}
      {isProblemModalOpen && (
        <StudentProblemModal
          currentUser={currentUser}
          services={services}
          onClose={() => setIsProblemModalOpen(false)}
          onProblemSubmitted={handleProblemSubmitted}
        />
      )}

      {emergencyModalService && (
        <EmergencyModal
          service={emergencyModalService}
          onClose={() => setEmergencyModalService(null)}
          onEmergencySuccess={handleEmergencySuccess}
        />
      )}

      {appointmentModalService && (
        <AppointmentModal
          service={appointmentModalService}
          onClose={() => setAppointmentModalService(null)}
          onAppointmentBooked={() => loadInitialData()}
        />
      )}

      {digitalModalService && (
        <DigitalRequestModal
          service={digitalModalService}
          onClose={() => setDigitalModalService(null)}
          onSubmitted={() => loadInitialData()}
        />
      )}

      {/* Modern Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(11, 15, 25, 0.95)',
        padding: '1.5rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.8rem'
      }}>
        <p style={{ margin: 0 }}>
          <strong>CampusFlow AI</strong> — Built for AWS Campus Hackathon. Powered by Amazon Bedrock, Lambda, DynamoDB & S3.
        </p>
      </footer>
    </div>
  );
}
