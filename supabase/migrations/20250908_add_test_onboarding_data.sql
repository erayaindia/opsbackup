-- =============================================================================
-- Add Test Data for Employee Onboarding System
-- Creates sample onboarding applications for testing
-- =============================================================================

-- Insert test onboarding applications
INSERT INTO public.onboarding_applicants (
  id,
  status,
  full_name,
  personal_email,
  phone,
  designation,
  work_location,
  employment_type,
  joined_at,
  addresses,
  emergency,
  documents,
  notes,
  created_at,
  updated_at
) VALUES 
-- Application 1: Submitted - Ready for review
(
  gen_random_uuid(),
  'submitted',
  'Priya Sharma',
  'priya.sharma@gmail.com',
  '+91 98765 43210',
  'Content Writer',
  'Patna',
  'Full-time',
  '2025-01-15'::date,
  '{"current": {"street": "123 MG Road", "city": "Patna", "state": "Bihar", "pin": "800001"}, "permanent": {"street": "456 Gandhi Nagar", "city": "Delhi", "state": "Delhi", "pin": "110001"}, "same_as_current": false}'::jsonb,
  '{"name": "Raj Sharma", "relationship": "Father", "phone": "+91 98765 12345", "email": "raj.sharma@gmail.com"}'::jsonb,
  '[{"type": "Aadhaar", "filename": "aadhaar_priya.pdf", "path": "applications/priya-sharma/aadhaar_priya.pdf", "size": 1024000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T10:30:00Z"}, {"type": "Resume", "filename": "priya_resume.pdf", "path": "applications/priya-sharma/priya_resume.pdf", "size": 2048000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T10:31:00Z"}, {"type": "Photo", "filename": "priya_photo.jpg", "path": "applications/priya-sharma/priya_photo.jpg", "size": 512000, "mime_type": "image/jpeg", "uploaded_at": "2025-09-08T10:32:00Z"}]'::jsonb,
  'Experienced content writer with 3+ years in digital marketing. Interested in fashion and lifestyle content creation.',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),

-- Application 2: Submitted - Another pending application
(
  gen_random_uuid(),
  'submitted',
  'Arjun Kumar',
  'arjun.kumar@outlook.com',
  '+91 87654 32109',
  'Marketing Executive',
  'Delhi',
  'Full-time',
  '2025-02-01'::date,
  '{"current": {"street": "789 CP Market", "city": "Delhi", "state": "Delhi", "pin": "110001"}, "same_as_current": true}'::jsonb,
  '{"name": "Sunita Kumar", "relationship": "Mother", "phone": "+91 87654 98765", "email": "sunita.kumar@yahoo.com"}'::jsonb,
  '[{"type": "PAN", "filename": "arjun_pan.pdf", "path": "applications/arjun-kumar/arjun_pan.pdf", "size": 800000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T09:15:00Z"}, {"type": "Education", "filename": "arjun_degree.pdf", "path": "applications/arjun-kumar/arjun_degree.pdf", "size": 1500000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T09:16:00Z"}, {"type": "Resume", "filename": "arjun_cv.pdf", "path": "applications/arjun-kumar/arjun_cv.pdf", "size": 1800000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T09:17:00Z"}]'::jsonb,
  'MBA graduate with specialization in digital marketing. Fluent in Hindi and English.',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),

-- Application 3: Approved - Already processed
(
  gen_random_uuid(),
  'approved',
  'Ravi Patel',
  'ravi.patel@gmail.com',
  '+91 98765 55555',
  'Fulfillment Associate',
  'Patna',
  'Full-time',
  '2024-12-01'::date,
  '{"current": {"street": "321 Station Road", "city": "Patna", "state": "Bihar", "pin": "800002"}, "permanent": {"street": "654 Village Road", "city": "Ahmedabad", "state": "Gujarat", "pin": "380001"}, "same_as_current": false}'::jsonb,
  '{"name": "Meera Patel", "relationship": "Spouse", "phone": "+91 98765 44444", "email": "meera.patel@gmail.com"}'::jsonb,
  '[{"type": "Aadhaar", "filename": "ravi_aadhaar.pdf", "path": "applications/ravi-patel/ravi_aadhaar.pdf", "size": 950000, "mime_type": "application/pdf", "uploaded_at": "2025-09-05T14:20:00Z"}, {"type": "BankProof", "filename": "ravi_bank.pdf", "path": "applications/ravi-patel/ravi_bank.pdf", "size": 1200000, "mime_type": "application/pdf", "uploaded_at": "2025-09-05T14:21:00Z"}]'::jsonb,
  'Previous experience in warehouse operations. Good with inventory management systems.',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
),

-- Application 4: Submitted - Recent application
(
  gen_random_uuid(),
  'submitted',
  'Sneha Gupta',
  'sneha.gupta@rediffmail.com',
  '+91 90123 45678',
  'Customer Support Executive',
  'Remote',
  'Full-time',
  '2025-01-20'::date,
  '{"current": {"street": "101 Tech Park", "city": "Bangalore", "state": "Karnataka", "pin": "560001"}, "same_as_current": true}'::jsonb,
  '{"name": "Amit Gupta", "relationship": "Brother", "phone": "+91 90123 11111", "email": "amit.gupta@gmail.com"}'::jsonb,
  '[{"type": "Resume", "filename": "sneha_resume.docx", "path": "applications/sneha-gupta/sneha_resume.docx", "size": 1100000, "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploaded_at": "2025-09-08T16:45:00Z"}, {"type": "Photo", "filename": "sneha_photo.png", "path": "applications/sneha-gupta/sneha_photo.png", "size": 400000, "mime_type": "image/png", "uploaded_at": "2025-09-08T16:46:00Z"}]'::jsonb,
  'Excellent communication skills. Experience with customer service and CRM systems. Willing to work remotely.',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),

-- Application 5: Submitted - Intern application
(
  gen_random_uuid(),
  'submitted',
  'Rohit Singh',
  'rohit.singh@student.edu',
  '+91 98888 77777',
  'Marketing Intern',
  'Patna',
  'Intern',
  '2025-01-10'::date,
  '{"current": {"street": "Student Hostel A-123", "city": "Patna", "state": "Bihar", "pin": "800005"}, "permanent": {"street": "Village Road", "city": "Muzaffarpur", "state": "Bihar", "pin": "842001"}, "same_as_current": false}'::jsonb,
  '{"name": "Rajesh Singh", "relationship": "Father", "phone": "+91 98888 99999"}'::jsonb,
  '[{"type": "Education", "filename": "rohit_marksheet.pdf", "path": "applications/rohit-singh/rohit_marksheet.pdf", "size": 700000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T11:30:00Z"}, {"type": "Resume", "filename": "rohit_cv.pdf", "path": "applications/rohit-singh/rohit_cv.pdf", "size": 900000, "mime_type": "application/pdf", "uploaded_at": "2025-09-08T11:31:00Z"}]'::jsonb,
  'Final year BBA student looking for internship opportunity. Interested in digital marketing and social media.',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '12 hours'
),

-- Application 6: Rejected - For testing rejection status
(
  gen_random_uuid(),
  'rejected',
  'Maya Verma',
  'maya.verma@hotmail.com',
  '+91 99999 88888',
  'Content Manager',
  'Delhi',
  'Full-time',
  '2025-01-05'::date,
  '{"current": {"street": "999 Central Avenue", "city": "Delhi", "state": "Delhi", "pin": "110010"}, "same_as_current": true}'::jsonb,
  '{"name": "Prakash Verma", "relationship": "Father", "phone": "+91 99999 77777"}'::jsonb,
  '[{"type": "Resume", "filename": "maya_resume.pdf", "path": "applications/maya-verma/maya_resume.pdf", "size": 1300000, "mime_type": "application/pdf", "uploaded_at": "2025-09-03T13:20:00Z"}]'::jsonb,
  'Rejection reason: Position requirements not met. Insufficient experience in fashion content.',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '3 days'
);

-- Update counts for verification
SELECT 
  status,
  COUNT(*) as count
FROM public.onboarding_applicants 
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'submitted' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'rejected' THEN 3
    WHEN 'withdrawn' THEN 4
  END;