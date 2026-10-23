import test from 'node:test';
import assert from 'node:assert/strict';

// Test speech text generation and sanitization logic
function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\)/g, '')
    .trim();
}

function buildAssessmentSpeechText(assessment) {
  if (!assessment) return '';

  const chunks = [];
  chunks.push(
    `Scam assessment complete. Overall evaluation is ${assessment.risk_level} risk, with a threat score of ${assessment.risk_score} out of 100.`
  );

  if (assessment.summary_headline) {
    chunks.push(cleanTextForSpeech(assessment.summary_headline) + '.');
  }

  if (assessment.detailed_explanation) {
    chunks.push(cleanTextForSpeech(assessment.detailed_explanation));
  }

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

  const flags = assessment.detected_warning_signs || [];
  if (flags.length > 0) {
    chunks.push(`We identified ${flags.length} warning sign${flags.length > 1 ? 's' : ''}:`);
    flags.forEach((flag, idx) => {
      chunks.push(
        `Warning sign ${idx + 1}: ${cleanTextForSpeech(flag.title)}. ${cleanTextForSpeech(flag.description)}`
      );
    });
  }

  const steps = assessment.verification_guidance?.independent_verification_steps || [];
  if (steps.length > 0) {
    chunks.push('Recommended independent verification steps:');
    steps.forEach((step, idx) => {
      chunks.push(`Step ${idx + 1}: ${cleanTextForSpeech(step)}`);
    });
  }

  const helplines = assessment.verification_guidance?.safe_helplines || [];
  if (helplines.length > 0) {
    chunks.push(`Official helplines available to call directly: ${cleanTextForSpeech(helplines.join('. '))}`);
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

test('cleanTextForSpeech strips emojis and normalizes spaces', () => {
  const input = '🛑 STOP! Call 1-800-000-0000 📞 now 🚨.';
  const cleaned = cleanTextForSpeech(input);
  assert.equal(cleaned, 'STOP! Call 1-800-000-0000 now .');
});

test('buildAssessmentSpeechText formats high-risk scam transcript without PII', () => {
  const mockAssessment = {
    risk_level: 'HIGH',
    risk_score: 90,
    summary_headline: '🚨 CRITICAL RISK: Grandparent Bail Scam',
    detailed_explanation: 'Caller demanded $4,500 in gift cards.',
    detected_warning_signs: [
      {
        category: 'impersonation',
        severity: 'critical',
        title: 'Family Distress Impersonation',
        description: 'Claimed grandchild is arrested in jail.'
      }
    ],
    verification_guidance: {
      immediate_action: '🛑 STOP: Do not buy gift cards.',
      pause_recommendation: 'Hang up and verify grandchild directly.',
      independent_verification_steps: [
        'Hang up the phone immediately.',
        'Call your grandchild on their known number.'
      ],
      safe_helplines: ['AARP Fraud Watch: 1-877-908-3360']
    }
  };

  const spoken = buildAssessmentSpeechText(mockAssessment);

  assert.match(spoken, /Overall evaluation is HIGH risk, with a threat score of 90 out of 100\./);
  assert.match(spoken, /CRITICAL RISK: Grandparent Bail Scam\./);
  assert.match(spoken, /Immediate protective action: STOP: Do not buy gift cards\./);
  assert.match(spoken, /Warning sign 1: Family Distress Impersonation\./);
  assert.match(spoken, /Step 1: Hang up the phone immediately\./);
  assert.match(spoken, /AARP Fraud Watch: 1-877-908-3360/);
  // Ensure emojis are not present in spoken text
  assert.doesNotMatch(spoken, /[🚨🛑📞]/u);
  // Ensure private contact info is not present
  assert.doesNotMatch(spoken, /password|ssn|pin/i);
});

test('buildAssessmentSpeechText handles empty or low-risk assessment safely', () => {
  const empty = buildAssessmentSpeechText(null);
  assert.equal(empty, '');

  const lowRisk = {
    risk_level: 'LOW',
    risk_score: 10,
    summary_headline: 'Routine Bank Appointment',
    detailed_explanation: 'Standard annual portfolio review notice.',
    detected_warning_signs: [],
    verification_guidance: {
      immediate_action: 'Verify at your convenience.',
      pause_recommendation: 'No emergency.',
      independent_verification_steps: ['Call branch directly if desired.'],
      safe_helplines: []
    }
  };

  const spoken = buildAssessmentSpeechText(lowRisk);
  assert.match(spoken, /Overall evaluation is LOW risk/);
  assert.match(spoken, /threat score of 10 out of 100/);
  assert.doesNotMatch(spoken, /Warning sign 1/);
});

// Implementation of buildAlexaSpokenSummary for testing
function buildAlexaSpokenSummary(assessment) {
  if (!assessment) return '';

  const chunks = [];
  const risk = assessment.risk_level || 'MODERATE';
  const score = typeof assessment.risk_score === 'number' ? assessment.risk_score : 50;

  if (risk === 'HIGH') {
    chunks.push(`ScamShield Warning: This interaction is evaluated as high risk, with a threat score of ${score} out of 100.`);
  } else if (risk === 'MODERATE') {
    chunks.push(`ScamShield Advisory: This interaction shows moderate risk indicators, with a threat score of ${score} out of 100.`);
  } else {
    chunks.push(`ScamShield Assessment: Low risk detected, with a threat score of ${score} out of 100.`);
  }

  if (assessment.summary_headline) {
    const headline = cleanTextForSpeech(assessment.summary_headline);
    if (headline) {
      chunks.push(headline.endsWith('.') ? headline : `${headline}.`);
    }
  }

  if (assessment.verification_guidance?.immediate_action) {
    const action = cleanTextForSpeech(assessment.verification_guidance.immediate_action);
    if (action) {
      chunks.push(`Immediate advice: ${action.endsWith('.') ? action : `${action}.`}`);
    }
  }

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

  if (assessment.cooling_off_recommended) {
    chunks.push('Please take a 15-minute cooling-off pause before taking any financial action.');
  }

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

test('buildAlexaSpokenSummary produces concise spoken warning for high-risk scam without emojis or invented claims', () => {
  const highRisk = {
    risk_level: 'HIGH',
    risk_score: 95,
    summary_headline: '🚨 CRITICAL RISK: Grandchild Emergency Bail Scam',
    verification_guidance: {
      immediate_action: '🛑 STOP AND PAUSE: Do not purchase gift cards or send any funds.',
      pause_recommendation: 'Hang up and contact your grandchild directly on their verified number.',
      independent_verification_steps: ['Call personal number.'],
    },
    cooling_off_recommended: true,
  };

  const spoken = buildAlexaSpokenSummary(highRisk);

  assert.match(spoken, /ScamShield Warning: This interaction is evaluated as high risk, with a threat score of 95 out of 100\./);
  assert.match(spoken, /CRITICAL RISK: Grandchild Emergency Bail Scam\./);
  assert.match(spoken, /Immediate advice: STOP AND PAUSE: Do not purchase gift cards or send any funds\./);
  assert.match(spoken, /Next step: Hang up and contact your grandchild directly on their verified number\./);
  assert.match(spoken, /15-minute cooling-off pause/);

  // Emojis stripped
  assert.doesNotMatch(spoken, /[🚨🛑📞]/u);
  // Never claims caller is verified
  assert.doesNotMatch(spoken, /caller is verified|caller has been verified|legitimate caller/i);
});

test('buildAlexaSpokenSummary produces calm advisory for low-risk notice without alarming orders', () => {
  const lowRisk = {
    risk_level: 'LOW',
    risk_score: 5,
    summary_headline: 'Routine In-Branch Portfolio Review',
    verification_guidance: {
      immediate_action: 'No immediate danger detected. No urgent payment was requested.',
      pause_recommendation: 'If desired, confirm with your bank branch during regular business hours.',
      independent_verification_steps: ['Call the number on your debit card.'],
    },
    cooling_off_recommended: false,
  };

  const spoken = buildAlexaSpokenSummary(lowRisk);

  assert.match(spoken, /ScamShield Assessment: Low risk detected, with a threat score of 5 out of 100\./);
  assert.match(spoken, /Routine In-Branch Portfolio Review\./);
  assert.match(spoken, /Immediate advice: No immediate danger detected\./);
  assert.match(spoken, /Next step: If desired, confirm with your bank branch/);
  // No alarming stop-payment orders or cooling off for low risk
  assert.doesNotMatch(spoken, /STOP PAYMENT|cooling-off pause/i);
  // Never invents caller verification
  assert.doesNotMatch(spoken, /caller is verified|caller has been verified/i);
});

test('buildAlexaSpokenSummary handles moderate risk and null safely', () => {
  const moderateRisk = {
    risk_level: 'MODERATE',
    risk_score: 50,
    summary_headline: 'Unverified Delivery Notice',
    verification_guidance: {
      immediate_action: 'Do not click links or share credentials.',
      pause_recommendation: 'Check official postal carrier tracking.',
    },
    cooling_off_recommended: false,
  };

  const spoken = buildAlexaSpokenSummary(moderateRisk);
  assert.match(spoken, /ScamShield Advisory: This interaction shows moderate risk indicators, with a threat score of 50 out of 100\./);

  assert.equal(buildAlexaSpokenSummary(null), '');
  assert.equal(buildAlexaSpokenSummary(undefined), '');
});

