import React from 'react';
import { Phone, Shield, Search, ClipboardList, BookOpen, Mic } from 'lucide-react';

interface NavbarProps {
  activeTab: 'assess' | 'dashboard' | 'guide';
  setActiveTab: (tab: 'assess' | 'dashboard' | 'guide') => void;
  fontSize: 'standard' | 'large' | 'xlarge';
  setFontSize: (size: 'standard' | 'large' | 'xlarge') => void;
  appMode: 'standard' | 'alexa_plus';
  setAppMode: (mode: 'standard' | 'alexa_plus') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  fontSize,
  setFontSize,
  appMode,
  setAppMode,
}) => {
  return (
    <header className="app-header">
      {/* Top Utility Bar */}
      <div className="top-utility-bar">
        <div className="utility-container">
          <div className="emergency-notice">
            <Phone size={15} strokeWidth={2} className="ui-icon ui-icon-navy" aria-hidden="true" />
            <span>
              National Elder Fraud Hotline: <strong>1-833-FRAUD-11</strong> (Toll-Free, Confidential)
            </span>
          </div>

          <div className="accessibility-controls" aria-label="Text Size Controls">
            <span className="control-label">Text Size:</span>
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'standard' ? 'active' : ''}`}
              onClick={() => setFontSize('standard')}
              aria-label="Standard text size"
            >
              A
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => setFontSize('large')}
              aria-label="Large text size"
            >
              A+
            </button>
            <button
              type="button"
              className={`font-size-btn ${fontSize === 'xlarge' ? 'active' : ''}`}
              onClick={() => setFontSize('xlarge')}
              aria-label="Extra large text size"
            >
              A++
            </button>
          </div>
        </div>
      </div>

      {/* Floating Pill Navbar */}
      <div className="floating-navbar-wrapper">
        <nav className="main-navbar floating-pill-navbar" aria-label="Main Navigation">
          <div
            className="brand-group"
            onClick={() => {
              setAppMode('standard');
              setActiveTab('assess');
            }}
            role="button"
            tabIndex={0}
          >
            <div className="brand-logo" aria-hidden="true">
              <Shield size={22} strokeWidth={2} className="ui-icon ui-icon-navy" />
            </div>
            <div className="brand-info">
              <div className="brand-title-wrap">
                <span className="brand-title">ScamShield AI</span>
                <span className="brand-badge">Prototype</span>
              </div>
              <p className="brand-subtitle">Scam-Intervention Assistant</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs" role="tablist" aria-label="Sections">
            <button
              type="button"
              role="tab"
              aria-selected={appMode === 'standard' && activeTab === 'assess'}
              className={`nav-tab-btn ${appMode === 'standard' && activeTab === 'assess' ? 'active' : ''}`}
              onClick={() => {
                setAppMode('standard');
                setActiveTab('assess');
              }}
            >
              <Search size={15} strokeWidth={2} className="ui-icon" aria-hidden="true" />
              <span>Check a Call / Request</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setAppMode('standard');
                setActiveTab('dashboard');
              }}
            >
              <ClipboardList size={15} strokeWidth={2} className="ui-icon" aria-hidden="true" />
              <span>Incident History</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'guide'}
              className={`nav-tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
              onClick={() => {
                setAppMode('standard');
                setActiveTab('guide');
              }}
            >
              <BookOpen size={15} strokeWidth={2} className="ui-icon" aria-hidden="true" />
              <span>Warning Signs Guide</span>
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mode-switcher-container" role="radiogroup" aria-label="Experience Mode">
            <button
              type="button"
              className={`mode-switch-btn ${appMode === 'standard' ? 'active' : ''}`}
              onClick={() => setAppMode('standard')}
              role="radio"
              aria-checked={appMode === 'standard'}
            >
              <Shield size={14} strokeWidth={2} className="ui-icon" aria-hidden="true" />
              <span>Standard Mode</span>
            </button>
            <button
              type="button"
              className={`mode-switch-btn ${appMode === 'alexa_plus' ? 'active' : ''}`}
              onClick={() => setAppMode('alexa_plus')}
              role="radio"
              aria-checked={appMode === 'alexa_plus'}
            >
              <Mic size={14} strokeWidth={2} className="ui-icon" aria-hidden="true" />
              <span>Alexa+ Mode</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};


