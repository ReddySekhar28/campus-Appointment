import { supabase } from '../lib/supabase';
import { 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_QUEUES, 
  INITIAL_EMERGENCY_REQUESTS, 
  INITIAL_PROBLEMS 
} from './mockData';

// Configurable API base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// In-Memory Local Persistence State for instant prototype execution
let services = JSON.parse(localStorage.getItem('cf_services')) || INITIAL_SERVICES;
let staff = JSON.parse(localStorage.getItem('cf_staff')) || INITIAL_STAFF;
let queues = JSON.parse(localStorage.getItem('cf_queues')) || INITIAL_QUEUES;
let emergencyRequests = JSON.parse(localStorage.getItem('cf_emergency_requests')) || INITIAL_EMERGENCY_REQUESTS;
let appointments = JSON.parse(localStorage.getItem('cf_appointments')) || [];
let digitalRequests = JSON.parse(localStorage.getItem('cf_digital_requests')) || [];
let problems = JSON.parse(localStorage.getItem('cf_problems')) || INITIAL_PROBLEMS;
let recentActivity = JSON.parse(localStorage.getItem('cf_activity')) || [
  { id: 1, text: "Aisha Fatima joined queue for Visa & Travel Signature", time: "Just now", type: "EMERGENCY" },
  { id: 2, text: "Marcus Vance signed & finalized transcript for Samantha Reed", time: "3m ago", type: "SIGNATURE_COMPLETED" },
  { id: 3, text: "Elena Rostova opened Counter 3 (Financial Aid Desk)", time: "5m ago", type: "STAFF" }
];

function saveState() {
  localStorage.setItem('cf_services', JSON.stringify(services));
  localStorage.setItem('cf_staff', JSON.stringify(staff));
  localStorage.setItem('cf_queues', JSON.stringify(queues));
  localStorage.setItem('cf_emergency_requests', JSON.stringify(emergencyRequests));
  localStorage.setItem('cf_appointments', JSON.stringify(appointments));
  localStorage.setItem('cf_digital_requests', JSON.stringify(digitalRequests));
  localStorage.setItem('cf_problems', JSON.stringify(problems));
  localStorage.setItem('cf_activity', JSON.stringify(recentActivity));
  
  // Dispatch custom storage event for live multi-tab & component reactivity
  window.dispatchEvent(new Event('campusflow_state_changed'));
}

export function logActivity(text, type = "GENERAL", student = {}) {
  const localActivity = {
    id: Date.now() + Math.random(),
    text,
    type,
    studentId: student.student_id || null,
    studentName: student.student_name || null,
    time: "Just now"
  };

  recentActivity.unshift(localActivity);

  if (recentActivity.length > 25) {
    recentActivity.pop();
  }

  saveState();

  // Save to the FastAPI backend.
  fetch(`${API_BASE_URL}/activity/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      type,
      student_id: student.student_id || null,
      student_name: student.student_name || null
    })
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Activity API returned HTTP ${response.status}`);
      }

      return response.json();
    })
    .then((data) => {
      console.log("Activity saved to PostgreSQL:", data.activity);
    })
    .catch((error) => {
      console.error("Failed to save activity:", error);
    });
}

// Calculate Wait Time Transparently based on active queue, avg duration & staff
export function calculateWaitTime(serviceId) {
  const service = services.find(s => s.serviceId === serviceId);
  if (!service) return 0;
  
  const waitingTickets = queues.filter(q => q.serviceId === serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'IN_PROGRESS'));
  const activeStaff = staff.filter(st => st.serviceId === serviceId && st.status === 'AVAILABLE').length || service.activeStaffCount || 1;
  
  const estimated = Math.max(0, Math.ceil((waitingTickets.length * service.avgDurationMinutes) / Math.max(1, activeStaff)));
  return estimated;
}

export const api = {
  // 1. Natural Language Intent & Urgency Extraction (Bedrock / Fallback Parser)
  async searchNavigator(query, studentName = 'Student') {
    if (!query || !query.trim()) return { matches: [], intent: null };

    logActivity(`Student (${studentName}) searched AI Navigator: "${query.substring(0, 45)}..."`, "SEARCH");

    // Attempt live API Gateway / Bedrock endpoint first
    try {
      const res = await fetch(`${API_BASE_URL}/navigator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.log('Using local AI intent parser fallback:', e.message);
    }

    const lower = query.toLowerCase();
    const urgencyKeywords = ['urgent', 'emergency', 'tomorrow', 'today', 'immediately', 'critical', 'deadline', 'asap', 'expedite'];
    const isUrgent = urgencyKeywords.some(kw => lower.includes(kw));

    const scoredServices = services.map(svc => {
      let score = 0;
      svc.tags.forEach(tag => {
        if (lower.includes(tag)) score += 3;
      });
      if (lower.includes(svc.name.toLowerCase())) score += 5;
      if (lower.includes(svc.category.toLowerCase())) score += 3;
      
      const estWait = calculateWaitTime(svc.serviceId);

      return {
        ...svc,
        score,
        estimatedWaitTime: estWait,
        currentQueueCount: queues.filter(q => q.serviceId === svc.serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION')).length
      };
    });

    const matches = scoredServices
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const results = matches.length > 0 ? matches : services.slice(0, 3).map(s => ({
      ...s,
      estimatedWaitTime: calculateWaitTime(s.serviceId),
      currentQueueCount: queues.filter(q => q.serviceId === s.serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION')).length
    }));

    return {
      intent: {
        rawQuery: query,
        detectedCategory: results[0]?.category || "General Inquiries",
        isUrgent,
        urgencyReason: isUrgent ? "Detected impending deadline or urgent operational keywords" : "Standard campus service request",
        recommendedAction: isUrgent ? "EMERGENCY_PRIORITY_OR_APPOINTMENT" : "JOIN_QUEUE_OR_DIGITAL"
      },
      matches: results
    };
  },

  // 2. Services
  async getServices() {
    return services.map(s => ({
      ...s,
      estimatedWaitTime: calculateWaitTime(s.serviceId),
      currentQueueCount: queues.filter(q => q.serviceId === s.serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION')).length
    }));
  },

  async getServiceById(serviceId) {
    const s = services.find(srv => srv.serviceId === serviceId);
    if (!s) throw new Error('Service not found');
    return {
      ...s,
      estimatedWaitTime: calculateWaitTime(serviceId),
      currentQueueCount: queues.filter(q => q.serviceId === serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION')).length
    };
  },

  // 3. STUDENT PROBLEM SUBMISSION & MULTI-PORTAL SYNC
  async submitStudentProblem(problemInput) {
  // 1. Require an authenticated Supabase session
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error(
      'Please sign in with your KLU account before submitting a complaint.'
    );
  }

  // 2. Determine urgency
  const lower = (
    (problemInput.title || '') + ' ' +
    (problemInput.description || '')
  ).toLowerCase();

  const urgencyKeywords = [
    'urgent',
    'emergency',
    'tomorrow',
    'today',
    'immediately',
    'critical',
    'deadline',
    'asap',
    'expedite',
    'flight',
    'lockout'
  ];

  const isUrgent =
    problemInput.isUrgent ||
    urgencyKeywords.some(keyword => lower.includes(keyword));

  // 3. Match the complaint to a campus service
  let matchedService = services.find(
    service => service.serviceId === problemInput.serviceId
  );

  if (!matchedService) {
    let maxScore = -1;

    services.forEach(service => {
      let score = 0;

      (service.tags || []).forEach(tag => {
        if (lower.includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      if (lower.includes(service.name.toLowerCase())) {
        score += 5;
      }

      if (lower.includes(service.category.toLowerCase())) {
        score += 3;
      }

      if (score > maxScore) {
        maxScore = score;
        matchedService = service;
      }
    });
  }

  if (!matchedService) {
    matchedService = services[0];
  }

  if (!matchedService) {
    throw new Error('No campus service is available for this complaint.');
  }

  // 4. Find the staff member for the matched service
  const assignedStaffMember =
    staff.find(
      member => member.serviceId === matchedService.serviceId
    ) || {
      name: 'Duty Desk Officer',
      staffId: 'STF-001'
    };

  // 5. Prepare the request.
  // Student identity is NOT sent by the browser.
  // FastAPI obtains it from the verified Supabase access token.
  const payload = {
    service_id: matchedService.serviceId,
    service_name: matchedService.name,
    category: matchedService.category,
    title: problemInput.title,
    description: problemInput.description,
    is_urgent: isUrgent,
    urgency_reason: isUrgent
      ? (
          problemInput.urgencyReason ||
          'High priority operational or impending academic/travel deadline'
        )
      : 'Standard service inquiry',
    assigned_counter: matchedService.counter,
    assigned_staff: assignedStaffMember.name,
    supporting_doc_name: problemInput.supportingDocName || null
  };

  // 6. Send complaint to FastAPI
  const response = await fetch(`${API_BASE_URL}/problems`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.detail ||
      `Complaint submission failed (HTTP ${response.status}).`
    );
  }

  if (!result.success || !result.problem) {
    throw new Error(
      'The server did not confirm that the complaint was saved.'
    );
  }

  // 7. Use the identity and complaint ID returned by the backend
  const savedProblem = result.problem;

  const newProblem = {
    problemId: savedProblem.problemId,
    studentName: savedProblem.studentName,
    studentId: savedProblem.studentId,
    email: savedProblem.email,
    serviceId: savedProblem.serviceId,
    serviceName: savedProblem.serviceName,
    category: savedProblem.category,
    title: savedProblem.title,
    description: savedProblem.description,
    isUrgent: savedProblem.isUrgent,
    urgencyReason: savedProblem.urgencyReason,
    status: savedProblem.status,
    assignedCounter: savedProblem.assignedCounter,
    assignedStaff: savedProblem.assignedStaff,
    staffNotes: savedProblem.staffNotes,
    resolutionDetails: savedProblem.resolutionDetails,
    supportingDocName: savedProblem.supportingDocName,
    createdAt: new Date().toISOString()
  };

  // 8. Update local UI state only after successful backend submission
  problems.unshift(newProblem);

  // 9. Preserve the existing local queue UI behaviour
  // Note: this queue entry is still local, not a database queue ticket.
  if (problemInput.joinQueueImmediately) {
    const prefix = matchedService.category
      .substring(0, 3)
      .toUpperCase();

    const ticketId = isUrgent
      ? `EMG-${prefix}-${Math.floor(100 + Math.random() * 900)}`
      : `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newQueueItem = {
      ticketId,
      serviceId: matchedService.serviceId,
      serviceName: matchedService.name,
      studentName: newProblem.studentName,
      studentId: newProblem.studentId,
      isEmergency: isUrgent,
      reason: newProblem.title,
      status: isUrgent ? 'PENDING_VERIFICATION' : 'WAITING',
      position: isUrgent
        ? 1
        : queues.filter(
            queue =>
              queue.serviceId === matchedService.serviceId &&
              queue.status === 'WAITING'
          ).length + 1,
      estimatedWaitMinutes: calculateWaitTime(
        matchedService.serviceId
      ),
      counter: matchedService.counter,
      office: matchedService.office,
      createdAt: new Date().toISOString()
    };

    queues.unshift(newQueueItem);

    matchedService.currentQueueLength =
      (matchedService.currentQueueLength || 0) + 1;
  }

  // 10. Log and save the updated frontend state
  logActivity(
    `Student (${newProblem.studentName}) submitted complaint ` +
    `[${newProblem.problemId}]: "${newProblem.title}"`,
    'PROBLEM'
  );

  saveState();

  return newProblem;
},
   

  async getProblems(filter = {}) {
    let list = [...problems];
    if (filter.studentId) {
      list = list.filter(p => p.studentId === filter.studentId);
    }
    if (filter.serviceId) {
      list = list.filter(p => p.serviceId === filter.serviceId);
    }
    if (filter.status) {
      list = list.filter(p => p.status === filter.status);
    }
    return list;
  },

  async updateProblemStatus(problemId, status, staffNotes = null, resolutionDetails = null) {
    const p = problems.find(prob => prob.problemId === problemId);
    if (p) {
      p.status = status;
      if (staffNotes !== null) p.staffNotes = staffNotes;
      if (resolutionDetails !== null) p.resolutionDetails = resolutionDetails;
      p.updatedAt = new Date().toISOString();
      logActivity(`Staff updated problem [${problemId}] status to ${status}`, "STAFF");
      saveState();
    }
    return p;
  },

  // 4. Normal Queue Management
  
async joinQueue(serviceId, studentInfo) {
    const service = services.find(s => s.serviceId === serviceId);

    if (!service) {
        throw new Error("Invalid service");
    }

    // Get the authenticated Supabase session
const {
    data: { session },
    error: sessionError
} = await supabase.auth.getSession();

if (sessionError || !session?.access_token) {
    throw new Error("Please sign in with your KLU account before joining the queue.");
}

// Send the verified session token to FastAPI
const response = await fetch(`${API_BASE_URL}/queue/join`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
        service: service.name
    })
});

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to join queue");
    }

    const result = data.queue;

    // Convert backend response into the existing frontend format
    const newTicket = {
        id: result.id,
        ticketId: result.ticket_id,
        serviceId: serviceId,
        serviceName: service.name,
        studentName: studentInfo.name || "Student",
        studentId: result.user_id,
        isEmergency: false,
        status: "WAITING",
        position: result.queue_number,
        estimatedWaitMinutes: result.estimated_wait_minutes,
        counter: service.counter,
        office: service.office,
        createdAt: new Date().toISOString()
    };

    // Update local UI state after successful database insertion
    queues.unshift(newTicket);

    service.currentQueueLength =
        (service.currentQueueLength || 0) + 1;

    logActivity(
        `Student (${newTicket.studentName}) joined queue for ${service.name} [Ticket: ${newTicket.ticketId}]`,
        "QUEUE"
    );

    saveState();

    return newTicket;
},


  // 5. Emergency Priority Flow with 2-3 Protected Slot Quota Verification
  async requestEmergencySlot(serviceId, emergencyData) {
    const service = services.find(s => s.serviceId === serviceId);
    if (!service) throw new Error('Invalid service ID');

    const quotaLimit = service.emergencyQuotaPerDay || 3;
    const currentUsed = service.emergencySlotsUsedToday || 0;

    if (currentUsed >= quotaLimit) {
      return {
        success: false,
        error: "QUOTA_EXHAUSTED",
        message: `Emergency capacity limit reached for today (${currentUsed}/${quotaLimit} slots allocated). To ensure fairness, no more automated emergency overrides can be created.`,
        quota: { used: currentUsed, limit: quotaLimit },
        fallbackOptions: [
          { type: "BOOK_NEXT_APPOINTMENT", label: "Book Priority Appointment Slot Tomorrow Morning" },
          { type: "DIGITAL_SUBMISSION", label: "Submit Expedited Digital Request with Supporting Docs" },
          { type: "STANDARD_QUEUE", label: "Join Standard Queue (Est. wait: " + calculateWaitTime(serviceId) + " mins)" }
        ]
      };
    }

    const slotNumber = currentUsed + 1;
    const ticketId = `EMG-${service.category.substring(0, 3).toUpperCase()}-00${slotNumber}`;
    const emergencyId = `EMG-REQ-${Date.now().toString().slice(-4)}`;

    const newEmergency = {
      emergencyId,
      serviceId,
      serviceName: service.name,
      studentName: emergencyData.studentName,
      studentId: emergencyData.studentId,
      email: emergencyData.email,
      deadline: emergencyData.deadline,
      reason: emergencyData.reason,
      supportingDocName: emergencyData.supportingDocName || "proof_document.pdf",
      supportingDocUrl: emergencyData.supportingDocUrl || "https://s3.amazonaws.com/campusflow/mock_doc.pdf",
      status: "PENDING_STAFF_APPROVAL",
      ticketId,
      allocatedSlotIndex: slotNumber,
      createdAt: new Date().toISOString()
    };

    const newQueueItem = {
      ticketId,
      serviceId,
      serviceName: service.name,
      studentName: emergencyData.studentName,
      studentId: emergencyData.studentId,
      isEmergency: true,
      reason: emergencyData.reason,
      status: "PENDING_VERIFICATION",
      position: 1,
      estimatedWaitMinutes: Math.min(10, service.avgDurationMinutes),
      counter: service.counter,
      office: service.office,
      createdAt: new Date().toISOString()
    };

    service.emergencySlotsUsedToday += 1;
    emergencyRequests.unshift(newEmergency);
    queues.unshift(newQueueItem);

    logActivity(`EMERGENCY SLOT RESERVED: ${emergencyData.studentName} booked slot ${slotNumber}/${quotaLimit} at ${service.counter} [Ticket: ${ticketId}]`, "EMERGENCY");
    saveState();

    return {
      success: true,
      message: `Emergency Priority Slot ${slotNumber}/${quotaLimit} successfully reserved! Awaiting final counter verification.`,
      ticket: newQueueItem,
      emergencyRecord: newEmergency,
      quota: {
        used: service.emergencySlotsUsedToday,
        limit: quotaLimit,
        remaining: quotaLimit - service.emergencySlotsUsedToday
      }
    };
  },

  // 6. Digital Request & S3 Upload Flow
  async getS3UploadPresignedUrl(filename, fileType) {
    const uniqueKey = `uploads/${Date.now()}-${filename.replace(/\s+/g, '_')}`;
    return {
      uploadUrl: `https://campusflow-student-documents.s3.us-east-1.amazonaws.com/${uniqueKey}`,
      fileKey: uniqueKey,
      expiresInSeconds: 900
    };
  },

  async submitDigitalRequest(serviceId, requestData) {
    const service = services.find(s => s.serviceId === serviceId);
    const requestId = `DIG-${Date.now().toString().slice(-5)}`;

    const newReq = {
      requestId,
      serviceId,
      serviceName: service?.name || 'Digital Service',
      studentName: requestData.studentName,
      studentId: requestData.studentId,
      email: requestData.email,
      details: requestData.details,
      uploadedFile: requestData.uploadedFile || null,
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
      estimatedTurnaround: "1-2 Business Days"
    };

    digitalRequests.unshift(newReq);
    logActivity(`Digital Request Submitted [${requestId}] by ${requestData.studentName} for ${service?.name}`, "DIGITAL");
    saveState();
    return newReq;
  },

  // 7. Appointments
  async bookAppointment(serviceId, data) {
    const service = services.find(s => s.serviceId === serviceId);
    const appointmentId = `APT-${Date.now().toString().slice(-4)}`;

    const appt = {
      appointmentId,
      serviceId,
      serviceName: service?.name,
      studentName: data.studentName,
      studentId: data.studentId,
      date: data.date,
      timeSlot: data.timeSlot,
      office: service?.office,
      counter: service?.counter,
      status: "CONFIRMED",
      createdAt: new Date().toISOString()
    };

    appointments.unshift(appt);
    logActivity(`Appointment Booked [${appointmentId}] by ${data.studentName} for ${service?.name} on ${data.date}`, "APPOINTMENT");
    saveState();
    return appt;
  },

  // 8. Staff Operations
  async getStaffQueues(serviceId) {
    const normalQueue = queues.filter(q => q.serviceId === serviceId && !q.isEmergency && q.status !== 'COMPLETED' && q.status !== 'CANCELLED');
    const emergencyQueue = queues.filter(q => q.serviceId === serviceId && q.isEmergency && q.status !== 'COMPLETED' && q.status !== 'CANCELLED');
    const pendingEmergencies = emergencyRequests.filter(e => e.serviceId === serviceId && e.status !== 'COMPLETED' && e.status !== 'REJECTED');
    const deptProblems = problems.filter(p => p.serviceId === serviceId && p.status !== 'RESOLVED');
    
    return {
      normalQueue,
      emergencyQueue,
      pendingEmergencies,
      deptProblems
    };
  },

  async callNextTicket(ticketId) {
    const ticket = queues.find(q => q.ticketId === ticketId);
    if (ticket) {
      ticket.status = 'IN_PROGRESS';
      logActivity(`Desk called ticket [${ticketId}] to counter desk!`, "CALL");
      saveState();
    }
    return ticket;
  },

  // Complete Ticket -> SIGNATURE COMPLETED -> Mark ticket COMPLETED, link emergency/problem, REDUCE WAIT TIME
  async completeTicket(ticketId, completionType = "SIGNATURE_COMPLETED") {
    const ticket = queues.find(q => q.ticketId === ticketId);
    if (!ticket) return null;

    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date().toISOString();
    ticket.resolutionType = completionType;

    // Automatically complete linked emergency request if applicable
    const emg = emergencyRequests.find(e => e.ticketId === ticketId || (e.studentId === ticket.studentId && e.serviceId === ticket.serviceId));
    if (emg && emg.status !== 'COMPLETED') {
      emg.status = 'COMPLETED';
      emg.completedAt = new Date().toISOString();
    }

    // Automatically resolve linked student inquiry/problem if applicable
    const prob = problems.find(p => p.studentId === ticket.studentId && p.serviceId === ticket.serviceId && p.status !== 'RESOLVED');
    if (prob) {
      prob.status = 'RESOLVED';
      prob.resolutionDetails = 'Resolved at counter desk via official signature & stamp.';
      prob.updatedAt = new Date().toISOString();
    }

    const service = services.find(s => s.serviceId === ticket.serviceId);
    if (service) {
      const remainingActiveInService = queues.filter(q => q.serviceId === ticket.serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION' || q.status === 'IN_PROGRESS' || q.status === 'CALLED'));
      service.currentQueueLength = remainingActiveInService.length;
    }

    // Dynamic Wait Time Reduction for all remaining waiting students in this service queue
    const activeStaff = staff.filter(st => st.serviceId === ticket.serviceId && st.status === 'AVAILABLE').length || service?.activeStaffCount || 1;
    const avgDuration = service?.avgDurationMinutes || 10;

    let positionCounter = 1;
    queues.forEach(q => {
      if (q.serviceId === ticket.serviceId && (q.status === 'WAITING' || q.status === 'APPROVED' || q.status === 'PENDING_VERIFICATION')) {
        q.position = positionCounter;
        q.estimatedWaitMinutes = Math.max(0, Math.ceil((positionCounter - 1) * avgDuration / activeStaff));
        q.justDecreased = true;
        positionCounter++;
      }
    });

    logActivity(`✍️ SIGNATURE COMPLETED: Staff finalized ticket [${ticketId}] at ${ticket.counter}! Reduced estimated wait times for all waiting students in line.`, "SIGNATURE_COMPLETED");
    saveState();
    return ticket;
  },

  async reviewEmergencyRequest(emergencyId, approved) {
    const req = emergencyRequests.find(e => e.emergencyId === emergencyId);
    if (req) {
      req.status = approved ? 'APPROVED' : 'REJECTED';
      const queueTicket = queues.find(q => q.ticketId === req.ticketId);
      if (queueTicket) {
        if (approved) {
          queueTicket.status = 'APPROVED';
        } else {
          queueTicket.status = 'WAITING';
          queueTicket.isEmergency = false;
        }
      }
      logActivity(`Staff reviewed emergency request [${emergencyId}]: ${approved ? 'APPROVED' : 'REJECTED'}`, "EMERGENCY_REVIEW");
      saveState();
    }
    return req;
  },

  // 9. Admin Operations, Pending Breakdown & Activity
  async getAdminMetrics() {
    const activeQueueStatuses = ['WAITING', 'APPROVED', 'PENDING_VERIFICATION', 'IN_PROGRESS', 'CALLED'];
    const waitingQueues = queues.filter(q => activeQueueStatuses.includes(q.status));
    const totalWaitingCount = waitingQueues.length;
    const totalEmergencyToday = emergencyRequests.length;
    const pendingEmergenciesCount = emergencyRequests.filter(e => e.status === 'PENDING_STAFF_APPROVAL' || e.status === 'APPROVED').length;
    const pendingProblemsList = problems.filter(p => p.status === 'PENDING' || p.status === 'IN_PROGRESS');
    const pendingProblemsCount = pendingProblemsList.length;
    const activeStaffTotal = staff.filter(s => s.status === 'AVAILABLE').length;

    // Total Overall Pending People across all active queues & inquiries
    const totalPendingOverall = totalWaitingCount + pendingProblemsCount;

    // Counter Breakdown with detailed pending lists for each counter
    const counterBreakdown = services.map(s => {
      const pendingInThisService = queues.filter(q => q.serviceId === s.serviceId && activeQueueStatuses.includes(q.status));
      const emergencyInThisService = pendingInThisService.filter(q => q.isEmergency);
      const normalInThisService = pendingInThisService.filter(q => !q.isEmergency);
      const problemsInThisService = problems.filter(p => p.serviceId === s.serviceId && p.status !== 'RESOLVED');
      const assignedStaff = staff.find(st => st.serviceId === s.serviceId) || { name: 'Desk Officer', status: 'AVAILABLE' };

      return {
        serviceId: s.serviceId,
        name: s.name,
        category: s.category,
        office: s.office,
        counter: s.counter,
        totalPending: pendingInThisService.length + problemsInThisService.length,
        queuePending: pendingInThisService.length,
        emergencyPending: emergencyInThisService.length,
        problemsPending: problemsInThisService.length,
        estimatedWaitMinutes: calculateWaitTime(s.serviceId),
        staffName: assignedStaff.name,
        staffStatus: assignedStaff.status,
        waitingStudents: pendingInThisService.map(q => ({
          ticketId: q.ticketId,
          studentName: q.studentName,
          studentId: q.studentId,
          isEmergency: q.isEmergency,
          status: q.status,
          waitMins: q.estimatedWaitMinutes
        }))
      };
    });

    const quotaStats = services.map(s => ({
      serviceId: s.serviceId,
      name: s.name,
      quotaLimit: s.emergencyQuotaPerDay || 3,
      quotaUsed: s.emergencySlotsUsedToday || 0,
      quotaRemaining: Math.max(0, (s.emergencyQuotaPerDay || 3) - (s.emergencySlotsUsedToday || 0)),
      queueLength: queues.filter(q => q.serviceId === s.serviceId && activeQueueStatuses.includes(q.status)).length,
      estimatedWaitMinutes: calculateWaitTime(s.serviceId)
    }));

    return {
      totalPendingOverall,
      totalWaiting: totalWaitingCount,
      totalEmergencyToday,
      pendingEmergenciesCount,
      pendingProblemsCount,
      activeStaffTotal,
      servicesCount: services.length,
      quotaStats,
      counterBreakdown,
      allQueues: queues,
      digitalRequestsCount: digitalRequests.length,
      totalProblemsCount: problems.length,
      recentActivity: recentActivity || []
    };
  },

  async getRecentActivity() {
    try {
      const response = await fetch(`${API_BASE_URL}/activity/?limit=50`);

      if (!response.ok) {
        throw new Error(`Activity API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.activities)) {
        const activities = data.activities.map((item) => ({
          id: item.id,
          activityId: item.activityId,
          text: item.text,
          type: item.type || "GENERAL",
          studentId: item.studentId || null,
          studentName: item.studentName || null,
          createdAt: item.createdAt,
          time: item.time || "Just now"
        }));

        recentActivity = activities;
        saveState();

        return activities;
      }

      return recentActivity || [];
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      return recentActivity || [];
    }
  },

  async getAllQueues() {
    return queues || [];
  },

  async updateEmergencyQuota(serviceId, newLimit) {
    const s = services.find(svc => svc.serviceId === serviceId);
    if (s) {
      s.emergencyQuotaPerDay = Number(newLimit);
      logActivity(`Admin updated emergency quota for ${s.name} to ${newLimit} slots/day`, "ADMIN");
      saveState();
    }
    return s;
  },

  // Reset demo state
  resetDemoData() {
    localStorage.removeItem('cf_services');
    localStorage.removeItem('cf_staff');
    localStorage.removeItem('cf_queues');
    localStorage.removeItem('cf_emergency_requests');
    localStorage.removeItem('cf_appointments');
    localStorage.removeItem('cf_digital_requests');
    localStorage.removeItem('cf_problems');
    localStorage.removeItem('cf_activity');
    window.location.reload();
  }
};
