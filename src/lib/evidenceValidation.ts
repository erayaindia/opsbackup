import { EvidenceTypeValue } from '@/types/tasks';

export interface TaskWithSubmissions {
  id: string;
  evidence_required: EvidenceTypeValue;
  submissions?: {
    evidence_type: string | null;
    submission_type: string;
  }[];
}

/**
 * Validates if a task has the required evidence uploaded
 * @param task Task object with evidence requirements and submissions
 * @returns Object with validation result and message
 */
export function validateTaskEvidence(task: TaskWithSubmissions): {
  isValid: boolean;
  message?: string;
  evidenceType?: EvidenceTypeValue;
} {
  // If no evidence is required, validation passes
  if (!task.evidence_required || task.evidence_required === 'none') {
    return { isValid: true };
  }

  // Check if task has evidence submissions
  const evidenceSubmissions = task.submissions?.filter(
    submission => submission.submission_type === 'evidence'
  ) || [];

  // If no evidence submissions found, validation fails
  if (evidenceSubmissions.length === 0) {
    return {
      isValid: false,
      message: `This task requires ${task.evidence_required} evidence to be uploaded before completion.`,
      evidenceType: task.evidence_required
    };
  }

  // Check if the submitted evidence matches the required type
  const hasMatchingEvidence = evidenceSubmissions.some(
    submission => submission.evidence_type === task.evidence_required
  );

  if (!hasMatchingEvidence) {
    return {
      isValid: false,
      message: `This task requires ${task.evidence_required} evidence. Please upload the required evidence type.`,
      evidenceType: task.evidence_required
    };
  }

  return { isValid: true };
}

/**
 * Gets user-friendly evidence type name
 */
export function getEvidenceTypeName(evidenceType: EvidenceTypeValue): string {
  const typeNames: Record<EvidenceTypeValue, string> = {
    'none': 'No evidence',
    'photo': 'Photo',
    'file': 'File',
    'link': 'Link',
    'checklist': 'Checklist'
  };

  return typeNames[evidenceType] || evidenceType;
}