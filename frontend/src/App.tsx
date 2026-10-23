import React, { useState, useEffect } from 'react';
import type { Incident, AssessmentResponse, AlertResponse, ReportDraftResponse } from './types';
import { ApiService } from './services/api';
import { Navbar } from './components/Navbar';
import { MockEngineNotice } from './components/MockEngineNotice';
import { ChatAssessment } from './components/ChatAssessment';
import { IncidentDashboard } from './components/IncidentDashboard';
import { EducationalGuide } from './components/EducationalGuide';
import { CoolingOffModal } from './components/CoolingOffModal';
import { TrustedContactModal } from './components/TrustedContactModal';
import { ReportDraftModal } from './components/ReportDraftModal';
import { AlexaSimulatedAssistant } from './components/AlexaSimulatedAssistant';
import { cancelSpeech } from './utils/speechUtils';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'standard' | 'alexa_plus'>('standard');
  const [activeTab, setActiveTab] = useState<'assess' | 'dashboard' | 'guide'>('assess');
  const [fontSize, setFontSize] = useState<'standard' | 'large' | 'xlarge'>('standard');
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Modal states
  const [isCoolingOffOpen, setIsCoolingOffOpen] = useState(false);
  const [coolingOffIncident, setCoolingOffIncident] = useState<Incident | null>(null);

  const [isTrustedContactOpen, setIsTrustedContactOpen] = useState(false);
  const [contactIncident, setContactIncident] = useState<Incident | null>(null);

  const [isReportDraftOpen, setIsReportDraftOpen] = useState(false);
  const [reportIncident, setReportIncident] = useState<Incident | null>(null);

  const currentYear = 2026;

  const loadIncidents = async () => {
    try {
      const data = await ApiService.listIncidents();
      setIncidents(data);
    } catch {
      // Backend not running yet or connection pending
    }
  };

  // Load initial incidents from backend
  useEffect(() => {
    let isMounted = true;
    ApiService.listIncidents()
      .then((data) => {
        if (isMounted) setIncidents(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tab: 'assess' | 'dashboard' | 'guide') => {
    cancelSpeech();
    setActiveTab(tab);
  };

  const handleIncidentCreated = (newIncident: Incident) => {
    setIncidents((prev) => [newIncident, ...prev]);
  };

  const handleOpenCoolingOff = (assessment: AssessmentResponse) => {
    // Find or create matching incident
    const matched = incidents.find((i) => i.assessment.assessment_id === assessment.assessment_id);
    if (matched) {
      setCoolingOffIncident(matched);
    }
    setIsCoolingOffOpen(true);
  };

  const handleSelectIncidentForCoolingOff = (incident: Incident) => {
    setCoolingOffIncident(incident);
    setIsCoolingOffOpen(true);
  };

  const handleCoolingOffCompleted = async () => {
    if (coolingOffIncident) {
      try {
        await ApiService.updateIncidentCoolingOff(coolingOffIncident.id, false);
        loadIncidents();
      } catch {
        // Continue
      }
    }
  };

  const handleOpenTrustedContact = (incident: Incident) => {
    setContactIncident(incident);
    setIsTrustedContactOpen(true);
  };

  const handleAlertSent = (_res: AlertResponse) => {
    loadIncidents();
  };

  const handleOpenReportDraft = (incident: Incident) => {
    setReportIncident(incident);
    setIsReportDraftOpen(true);
  };

  const handleReportDrafted = (_res: ReportDraftResponse) => {
    loadIncidents();
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await ApiService.updateIncidentCoolingOff(incidentId, false);
      loadIncidents();
    } catch {
      // Continue
    }
  };

  return (
    <div className={`app-root font-size-${fontSize}`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        fontSize={fontSize}
        setFontSize={setFontSize}
        appMode={appMode}
        setAppMode={(mode) => {
          cancelSpeech();
          setAppMode(mode);
        }}
      />

      <MockEngineNotice />

      <main className="main-content-area" role="main">
        {appMode === 'alexa_plus' ? (
          <AlexaSimulatedAssistant
            onIncidentCreated={handleIncidentCreated}
            onOpenCoolingOff={handleOpenCoolingOff}
            onOpenTrustedContact={handleOpenTrustedContact}
            onOpenReportDraft={handleOpenReportDraft}
            onSwitchToStandardMode={() => {
              cancelSpeech();
              setAppMode('standard');
            }}
          />
        ) : (
          <>
            {activeTab === 'assess' && (
              <ChatAssessment
                onIncidentCreated={handleIncidentCreated}
                onOpenCoolingOff={handleOpenCoolingOff}
                onOpenTrustedContact={handleOpenTrustedContact}
                onOpenReportDraft={handleOpenReportDraft}
              />
            )}

            {activeTab === 'dashboard' && (
              <IncidentDashboard
                incidents={incidents}
                onSelectIncidentForCoolingOff={handleSelectIncidentForCoolingOff}
                onSelectIncidentForAlert={handleOpenTrustedContact}
                onSelectIncidentForReport={handleOpenReportDraft}
                onResolveIncident={handleResolveIncident}
                onSwitchToAssess={() => handleTabChange('assess')}
              />
            )}

            {activeTab === 'guide' && <EducationalGuide />}
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-copyright">
            © {currentYear} ScamShield AI — Scam-Intervention Assistant Prototype.
          </p>
          <p className="footer-disclaimer">
            <strong>Safety & Ethical Disclosure:</strong> This software is a prototype for educational scam intervention. 
            It does not perform automated bank transfers, payment blocking, unauthorized recording, or call interception. 
            All scam assessments are generated by local synthetic heuristics.
          </p>
        </div>
      </footer>

      {/* Global Interactive Modals */}
      <CoolingOffModal
        isOpen={isCoolingOffOpen}
        onClose={() => setIsCoolingOffOpen(false)}
        onCompleted={handleCoolingOffCompleted}
        initialMinutes={15}
      />

      <TrustedContactModal
        isOpen={isTrustedContactOpen}
        incident={contactIncident}
        onClose={() => setIsTrustedContactOpen(false)}
        onAlertSent={handleAlertSent}
      />

      <ReportDraftModal
        isOpen={isReportDraftOpen}
        incident={reportIncident}
        onClose={() => setIsReportDraftOpen(false)}
        onReportDrafted={handleReportDrafted}
      />
    </div>
  );
};

export default App;
