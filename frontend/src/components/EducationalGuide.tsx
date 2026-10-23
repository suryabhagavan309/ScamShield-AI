import React from 'react';
import {
  UserX,
  Clock,
  Lock,
  CreditCard,
  Shield,
  Phone,
} from 'lucide-react';

export const EducationalGuide: React.FC = () => {
  return (
    <div className="educational-guide-container">
      <div className="guide-header">
        <h2 className="guide-title">Scam Warning Signs & Protection Guide</h2>
        <p className="guide-subtitle">
          Criminals exploit trust, fear, and urgency. Memorize the four universal red flags below.
        </p>
      </div>

      {/* The 4 Golden Pillars of Scam Detection */}
      <div className="pillars-grid">
        <div className="pillar-card border-red">
          <div className="pillar-icon" aria-hidden="true">
            <UserX size={28} className="ui-icon-danger" strokeWidth={2} />
          </div>
          <h3 className="pillar-title">1. Impersonation</h3>
          <p className="pillar-desc">
            The caller claims to be someone of high authority (IRS, police, sheriff, bank fraud department) 
            or a family member in emotional distress (grandson arrested, in hospital).
          </p>
          <div className="golden-rule">
            <strong>Golden Rule:</strong> Caller ID can easily be faked (spoofed). Never trust the name on your phone screen.
          </div>
        </div>

        <div className="pillar-card border-orange">
          <div className="pillar-icon" aria-hidden="true">
            <Clock size={28} className="ui-icon-warning" strokeWidth={2} />
          </div>
          <h3 className="pillar-title">2. Urgency & Panic</h3>
          <p className="pillar-desc">
            "Act within 1 hour," "stay on the phone right now," or "an arrest warrant will be served today." 
            They manufacture terror so your adrenaline spikes and you stop thinking critically.
          </p>
          <div className="golden-rule">
            <strong>Golden Rule:</strong> Legitimate agencies will ALWAYS allow you time to hang up and verify. Real emergencies do not accept gift cards.
          </div>
        </div>

        <div className="pillar-card border-purple">
          <div className="pillar-icon" aria-hidden="true">
            <Lock size={28} className="ui-icon-calm" strokeWidth={2} />
          </div>
          <h3 className="pillar-title">3. Forced Secrecy</h3>
          <p className="pillar-desc">
            "Do not tell your spouse or children," "do not speak to the bank teller," or "say the withdrawal is for home improvement." 
            Criminals isolate you so a third party doesn't alert you to the fraud.
          </p>
          <div className="golden-rule">
            <strong>Golden Rule:</strong> The moment anyone asks you to keep a financial transaction secret, it is 100% a scam.
          </div>
        </div>

        <div className="pillar-card border-amber">
          <div className="pillar-icon" aria-hidden="true">
            <CreditCard size={28} className="ui-icon-warning" strokeWidth={2} />
          </div>
          <h3 className="pillar-title">4. Pressure to Pay Unusual Ways</h3>
          <p className="pillar-desc">
            Demanding gift cards (Target, Apple, Walmart), Bitcoin ATMs, wire transfers, peer-to-peer apps, 
            or sending couriers to pick up cash. Or claiming you must move funds into a "safe reserve account."
          </p>
          <div className="golden-rule">
            <strong>Golden Rule:</strong> NO government agency, power company, or court accepts gift cards or cryptocurrency. Never move money to a "safe account."
          </div>
        </div>
      </div>

      {/* Action Playbook */}
      <div className="action-playbook-card">
        <h3>
          <Shield size={20} className="ui-icon-navy" aria-hidden="true" />
          <span> The 3-Step ScamShield Pause Playbook</span>
        </h3>
        <div className="steps-row">
          <div className="play-step">
            <div className="step-num">Step 1</div>
            <h4>STOP & HANG UP</h4>
            <p>
              Do not argue, do not explain, and do not be polite. Just hang up the phone. 
              Genuine institutions do not take offense at safety caution.
            </p>
          </div>

          <div className="play-step">
            <div className="step-num">Step 2</div>
            <h4>COOL OFF 15 MINUTES</h4>
            <p>
              Take three deep breaths, drink a glass of water, and allow your heartbeat to return to normal. 
              Talk to a trusted friend or adult child.
            </p>
          </div>

          <div className="play-step">
            <div className="step-num">Step 3</div>
            <h4>INDEPENDENTLY VERIFY</h4>
            <p>
              Look up the telephone number on your physical plastic credit/debit card, or official printed monthly statement. 
              Never call the number the caller gave you.
            </p>
          </div>
        </div>
      </div>

      {/* Official Directory */}
      <div className="official-directory-card">
        <h3>
          <Phone size={20} className="ui-icon-navy" aria-hidden="true" />
          <span> Official Free Helplines for Older Adults (US & North America)</span>
        </h3>
        <div className="helpline-table">
          <div className="helpline-row">
            <div>
              <strong>U.S. DOJ National Elder Fraud Hotline</strong>
              <p>Free, dedicated case managers to support seniors facing fraud attempts.</p>
            </div>
            <a href="tel:18333728311" className="helpline-phone">1-833-FRAUD-11 (1-833-372-8311)</a>
          </div>

          <div className="helpline-row">
            <div>
              <strong>AARP Fraud Watch Network Helpline</strong>
              <p>Trained fraud specialists offering free guidance to anyone, AARP membership not required.</p>
            </div>
            <a href="tel:18779083360" className="helpline-phone">1-877-908-3360</a>
          </div>

          <div className="helpline-row">
            <div>
              <strong>Federal Trade Commission (FTC)</strong>
              <p>Official consumer protection agency for reporting scams and identity theft.</p>
            </div>
            <a href="https://ReportFraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="helpline-link">
              ReportFraud.ftc.gov
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
