export const INITIAL_SERVICES = [
  {
    serviceId: "SRV-INT-001",
    name: "International Visa Letter & Travel Signature",
    category: "International Students",
    office: "Global Education Center (Building G, 2nd Floor)",
    counter: "Counter 4 (Visa & Immigration Desk)",
    description: "Urgent I-20 travel endorsements, visa status verification letters, and embassy appointment certification.",
    avgDurationMinutes: 12,
    allowDigital: true,
    allowAppointment: true,
    emergencyQuotaPerDay: 3,
    emergencySlotsUsedToday: 1,
    currentQueueLength: 4,
    activeStaffCount: 2,
    operatingHours: "09:00 AM - 04:30 PM",
    requiredDocuments: [
      "Valid Passport Copy",
      "Form I-20 or DS-2019 (Current)",
      "Proof of Next-Day Embassy/Visa Interview (for Emergency)",
      "Current Enrollment Verification"
    ],
    tags: ["visa", "passport", "immigration", "embassy", "travel signature", "i-20", "international", "urgent visa"]
  },
  {
    serviceId: "SRV-REG-001",
    name: "Official Academic Transcript & Degree Attestation",
    category: "Academic Records",
    office: "Registrar's Office (Administration Block A, Room 102)",
    counter: "Counters 1 & 2 (Academic Services)",
    description: "Official sealed paper transcripts, WES verification, provisional certificates, and embassy stampings.",
    avgDurationMinutes: 8,
    allowDigital: true,
    allowAppointment: true,
    emergencyQuotaPerDay: 2,
    emergencySlotsUsedToday: 0,
    currentQueueLength: 6,
    activeStaffCount: 2,
    operatingHours: "08:30 AM - 05:00 PM",
    requiredDocuments: [
      "Student ID Card",
      "Fee Clearance Receipt (Digital/Paper)",
      "Application Form with Reference Number",
      "Proof of Immediate Graduate Application Deadline (for Emergency)"
    ],
    tags: ["transcript", "degree", "grades", "attestation", "wes", "certificate", "marksheet", "registrar", "credits"]
  },
  {
    serviceId: "SRV-FIN-001",
    name: "Scholarship Disbursement & Urgent Fee Deferral",
    category: "Financial Aid",
    office: "Financial Aid & Bursar (Student Services Wing, Room 204)",
    counter: "Counter 3 (Bursar & Loans)",
    description: "Urgent scholarship release, fee extension requests, banking verification letters, and hold removal.",
    avgDurationMinutes: 15,
    allowDigital: true,
    allowAppointment: true,
    emergencyQuotaPerDay: 3,
    emergencySlotsUsedToday: 2,
    currentQueueLength: 5,
    activeStaffCount: 1,
    operatingHours: "09:00 AM - 04:00 PM",
    requiredDocuments: [
      "Official Scholarship Award Letter",
      "Financial Hardship Statement / Proof of Extenuating Circumstances",
      "Government ID / Passport",
      "Fee Invoice Statement"
    ],
    tags: ["scholarship", "fees", "financial aid", "bursar", "hold removal", "loan", "payment", "bank letter"]
  },
  {
    serviceId: "SRV-SEC-001",
    name: "Student ID Card Replacement & Access Card Reissue",
    category: "Campus Security & Cards",
    office: "Campus Security Hub (Main Entrance Pavilion)",
    counter: "Counter 6 (Card Operations)",
    description: "Instant photo ID card printing, lost card deactivation, RFID lab access activation, and transit passes.",
    avgDurationMinutes: 5,
    allowDigital: true,
    allowAppointment: false,
    emergencyQuotaPerDay: 2,
    emergencySlotsUsedToday: 0,
    currentQueueLength: 3,
    activeStaffCount: 2,
    operatingHours: "08:00 AM - 06:00 PM",
    requiredDocuments: [
      "Government-issued Photo ID (Driver's License / Passport)",
      "Police Lost Report / Affidavit (if stolen)",
      "Receipt of $15 Card Replacement Fee"
    ],
    tags: ["id card", "student id", "lost card", "access card", "rfid", "dorm key", "security", "badge"]
  },
  {
    serviceId: "SRV-HLT-001",
    name: "Medical Leave Certificate & Health Clearance",
    category: "Health & Wellness",
    office: "University Health & Wellbeing Center (Wellness Building, Room 105)",
    counter: "Counter 2 (Medical Records)",
    description: "Physician-signed medical absence certificates, immunization waivers, and exam deferral authorizations.",
    avgDurationMinutes: 10,
    allowDigital: true,
    allowAppointment: true,
    emergencyQuotaPerDay: 3,
    emergencySlotsUsedToday: 1,
    currentQueueLength: 2,
    activeStaffCount: 1,
    operatingHours: "08:30 AM - 05:30 PM",
    requiredDocuments: [
      "Hospital Discharge Summary / Doctor's Prescription",
      "Medical Examination Form",
      "Course Absence Details & Professor Contacts"
    ],
    tags: ["health", "medical", "sick leave", "doctor certificate", "wellness", "immunization", "exam deferral"]
  },
  {
    serviceId: "SRV-HOU-001",
    name: "Campus Housing Assignment & Emergency Room Lockout",
    category: "Housing & Residential",
    office: "Housing Office (North Quad Commons)",
    counter: "Counter 5 (Residential Life)",
    description: "Dorm check-in, key exchange, room maintenance escalation, and emergency accommodation.",
    avgDurationMinutes: 10,
    allowDigital: false,
    allowAppointment: true,
    emergencyQuotaPerDay: 2,
    emergencySlotsUsedToday: 0,
    currentQueueLength: 2,
    activeStaffCount: 1,
    operatingHours: "09:00 AM - 05:00 PM",
    requiredDocuments: [
      "Housing Contract Confirmation",
      "Student ID",
      "Signed Room Condition Report"
    ],
    tags: ["housing", "dorm", "room", "lockout", "residential", "roommate", "keys"]
  }
];

export const INITIAL_STAFF = [
  {
    staffId: "STF-001",
    name: "Priya Sharma",
    role: "Senior Immigration Advisor",
    serviceId: "SRV-INT-001",
    counter: "Counter 4 (Visa & Immigration Desk)",
    status: "AVAILABLE",
    activeTicket: "INT-102"
  },
  {
    staffId: "STF-002",
    name: "Marcus Vance",
    role: "Assistant Registrar",
    serviceId: "SRV-REG-001",
    counter: "Counters 1 & 2 (Academic Services)",
    status: "AVAILABLE",
    activeTicket: "REG-089"
  },
  {
    staffId: "STF-003",
    name: "Elena Rostova",
    role: "Financial Aid Counselor",
    serviceId: "SRV-FIN-001",
    counter: "Counter 3 (Bursar & Loans)",
    status: "AVAILABLE",
    activeTicket: "FIN-045"
  },
  {
    staffId: "STF-004",
    name: "David Chen",
    role: "Security & Card Specialist",
    serviceId: "SRV-SEC-001",
    counter: "Counter 6 (Card Operations)",
    status: "AVAILABLE",
    activeTicket: null
  }
];

export const INITIAL_QUEUES = [
  {
    ticketId: "INT-101",
    serviceId: "SRV-INT-001",
    studentName: "Alex Chen",
    studentId: "STU-9921",
    isEmergency: false,
    status: "CALLED",
    position: 1,
    estimatedWaitMinutes: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    ticketId: "EMG-INT-001",
    serviceId: "SRV-INT-001",
    studentName: "Aisha Fatima",
    studentId: "STU-8842",
    isEmergency: true,
    reason: "Embassy visa interview tomorrow 8:00 AM",
    status: "APPROVED",
    position: 1,
    estimatedWaitMinutes: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    ticketId: "REG-088",
    serviceId: "SRV-REG-001",
    studentName: "Samantha Reed",
    studentId: "STU-7723",
    isEmergency: false,
    status: "IN_PROGRESS",
    position: 1,
    estimatedWaitMinutes: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    ticketId: "FIN-044",
    serviceId: "SRV-FIN-001",
    studentName: "Michael Brown",
    studentId: "STU-6619",
    isEmergency: false,
    status: "WAITING",
    position: 2,
    estimatedWaitMinutes: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  }
];

export const INITIAL_EMERGENCY_REQUESTS = [
  {
    emergencyId: "EMG-REQ-001",
    serviceId: "SRV-INT-001",
    serviceName: "International Visa Letter & Travel Signature",
    studentName: "Aisha Fatima",
    studentId: "STU-8842",
    email: "aisha.fatima@campus.edu",
    deadline: "2026-08-23",
    reason: "Consulate visa interview scheduled for tomorrow at 8:30 AM. Need official stamped travel endorsement immediately.",
    supportingDocName: "embassy_appointment_aisha.pdf",
    supportingDocUrl: "https://campusflow-docs.s3.amazonaws.com/embassy_appointment_aisha.pdf",
    status: "APPROVED",
    ticketId: "EMG-INT-001",
    allocatedSlotIndex: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export const INITIAL_PROBLEMS = [
  {
    problemId: "PRB-2026-001",
    studentName: "Aisha Fatima",
    studentId: "STU-8842",
    email: "aisha.fatima@campus.edu",
    serviceId: "SRV-INT-001",
    serviceName: "International Visa Letter & Travel Signature",
    category: "International Students",
    title: "Urgent I-20 Travel Endorsement for Embassy Interview Tomorrow",
    description: "My visa renewal appointment at the consulate is scheduled for tomorrow at 8:30 AM. I need an in-person physical stamp and signed endorsement on page 2 of my I-20 before 4 PM today.",
    isUrgent: true,
    urgencyReason: "24-hour impending official visa interview deadline",
    status: "IN_PROGRESS", // PENDING, IN_PROGRESS, RESOLVED
    assignedCounter: "Counter 4 (Visa & Immigration Desk)",
    assignedStaff: "Priya Sharma",
    staffNotes: "Student notified. Original I-20 document ready for physical seal inspection at Desk 4.",
    resolutionDetails: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    problemId: "PRB-2026-002",
    studentName: "Jordan Lee",
    studentId: "STU-5512",
    email: "jordan.lee@campus.edu",
    serviceId: "SRV-REG-001",
    serviceName: "Official Academic Transcript & Degree Attestation",
    category: "Academic Records",
    title: "Transcript Seal Required for Graduate School Admission Deadline",
    description: "Applying for the Fall 2026 master's program cutoff tonight. Need registrar sealed PDF sent directly to University of Washington.",
    isUrgent: true,
    urgencyReason: "Graduate school application cutoff today at 11:59 PM",
    status: "PENDING",
    assignedCounter: "Counters 1 & 2 (Academic Services)",
    assignedStaff: "Marcus Vance",
    staffNotes: null,
    resolutionDetails: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    problemId: "PRB-2026-003",
    studentName: "Carlos Mendez",
    studentId: "STU-3319",
    email: "carlos.m@campus.edu",
    serviceId: "SRV-FIN-001",
    serviceName: "Scholarship Disbursement & Urgent Fee Deferral",
    category: "Financial Aid",
    title: "Course Registration Financial Hold Deferral Request",
    description: "My external merit scholarship check was mailed by the sponsor last week, but financial hold on portal is blocking my final semester course enrollment.",
    isUrgent: false,
    urgencyReason: "Standard enrollment administrative hold",
    status: "PENDING",
    assignedCounter: "Counter 3 (Bursar & Loans)",
    assignedStaff: "Elena Rostova",
    staffNotes: null,
    resolutionDetails: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  }
];
