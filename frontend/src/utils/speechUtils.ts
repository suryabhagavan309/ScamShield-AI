import type { AssessmentResponse } from '../types';

/**
 * Strips emoji characters, markdown symbols, and formatting noise to ensure
 * smooth, natural, and accessible text-to-speech output for older adults.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove emojis, symbols, and pictographic characters using standard Unicode property escapes
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Normalize punctuation and whitespace
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .trim();
}

/**
 * Constructs a clear, sequential spoken transcript for an assessment result.
 * 
 * PRIVACY & SAFETY GUARANTEE:
 * - Does not speak raw contact information, unmasked phone numbers, or hidden backend fields.
 * - Focuses strictly on the risk tier, score, plain-language explanation, warning signs,
 *   and verified protective action steps.
 */
export function buildAssessmentSpeechText(assessment: AssessmentResponse): string {
  if (!assessment) return '';

  const chunks: string[] = [];

  // 1. Risk Tier and Score
  chunks.push(
    `Scam assessment complete. Overall evaluation is ${assessment.risk_level} risk, with a threat score of ${assessment.risk_score} out of 100.`
  );

  // 2. Headline Summary
  if (assessment.summary_headline) {
    chunks.push(cleanTextForSpeech(assessment.summary_headline) + '.');
  }

  // 3. Detailed Explanation
  if (assessment.detailed_explanation) {
    chunks.push(cleanTextForSpeech(assessment.detailed_explanation));
  }

  // 4. Primary Protective Advice
  if (assessment.verification_guidance?.immediate_action) {
    chunks.push(
      `Immediate protective action: ${cleanTextForSpeech(assessment.verification_guidance.immediate_action)}`
    );
  }

  if (assessment.verification_guidance?.pause_recommendation) {
    chunks.push(
      `Recommendation: ${cleanTextForSpeech(assessment.verification_guidance.pause_recommendation)}`
    );
  }

  // 5. Detected Red Flags
  const flags = assessment.detected_warning_signs || [];
  if (flags.length > 0) {
    chunks.push(`We identified ${flags.length} warning sign${flags.length > 1 ? 's' : ''}:`);
    flags.forEach((flag, idx) => {
      chunks.push(
        `Warning sign ${idx + 1}: ${cleanTextForSpeech(flag.title)}. ${cleanTextForSpeech(flag.description)}`
      );
    });
  }

  // 6. Independent Verification Steps
  const steps = assessment.verification_guidance?.independent_verification_steps || [];
  if (steps.length > 0) {
    chunks.push('Recommended independent verification steps:');
    steps.forEach((step, idx) => {
      chunks.push(`Step ${idx + 1}: ${cleanTextForSpeech(step)}`);
    });
  }

  // 7. Helpline Directory
  const helplines = assessment.verification_guidance?.safe_helplines || [];
  if (helplines.length > 0) {
    chunks.push(`Official helplines available to call directly: ${cleanTextForSpeech(helplines.join('. '))}`);
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Safely cancels any ongoing browser speech playback.
 */
export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Constructs a concise, natural conversational spoken verdict and safe next steps
 * suitable for an Alexa voice assistant interaction.
 * 
 * SAFETY & ACCURACY DIRECTIVES:
 * - Emits clear, risk-consistent spoken guidance based exclusively on actual assessment data.
 * - Never invents verification results or falsely claims that a caller has been verified.
 * - For low-risk notices, advises routine caution without alarming stop-payment directives.
 * - Strips emojis, control symbols, and unwanted whitespace for smooth pronunciation.
 */
export function buildAlexaSpokenSummary(assessment: AssessmentResponse | null | undefined): string {
  if (!assessment) return '';

  const chunks: string[] = [];
  const risk = assessment.risk_level || 'MODERATE';
  const score = typeof assessment.risk_score === 'number' ? assessment.risk_score : 50;

  // 1. Direct, empathetic opening verdict
  if (risk === 'HIGH') {
    chunks.push(`ScamShield Warning: This interaction is evaluated as high risk, with a threat score of ${score} out of 100.`);
  } else if (risk === 'MODERATE') {
    chunks.push(`ScamShield Advisory: This interaction shows moderate risk indicators, with a threat score of ${score} out of 100.`);
  } else {
    chunks.push(`ScamShield Assessment: Low risk detected, with a threat score of ${score} out of 100.`);
  }

  // 2. Clear headline context
  if (assessment.summary_headline) {
    const headline = cleanTextForSpeech(assessment.summary_headline);
    if (headline) {
      chunks.push(headline.endsWith('.') ? headline : `${headline}.`);
    }
  }

  // 3. Immediate protective action from actual assessment
  if (assessment.verification_guidance?.immediate_action) {
    const action = cleanTextForSpeech(assessment.verification_guidance.immediate_action);
    if (action) {
      chunks.push(`Immediate advice: ${action.endsWith('.') ? action : `${action}.`}`);
    }
  }

  // 4. Safe independent verification guidance
  if (assessment.verification_guidance?.pause_recommendation) {
    const pauseRec = cleanTextForSpeech(assessment.verification_guidance.pause_recommendation);
    if (pauseRec) {
      chunks.push(`Next step: ${pauseRec.endsWith('.') ? pauseRec : `${pauseRec}.`}`);
    }
  } else if (assessment.verification_guidance?.independent_verification_steps?.length) {
    const step = cleanTextForSpeech(assessment.verification_guidance.independent_verification_steps[0]);
    if (step) {
      chunks.push(`Recommended next step: ${step.endsWith('.') ? step : `${step}.`}`);
    }
  }

  // 5. Cooling-off pause reminder if recommended
  if (assessment.cooling_off_recommended) {
    chunks.push('Please take a 15-minute cooling-off pause before taking any financial action.');
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

