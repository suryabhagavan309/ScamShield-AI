import React from 'react';
import { Info } from 'lucide-react';

export const MockEngineNotice: React.FC = () => {
  return (
    <aside className="mock-engine-banner" aria-label="Prototype Mock Engine Disclosure">
      <div className="banner-content">
        <span className="banner-badge" aria-hidden="true">
          <Info size={13} className="ui-icon-navy" aria-hidden="true" />
          <span>PROTOTYPE ENGINE</span>
        </span>
        <p className="banner-text">
          <strong>Clearly Labelled Mock Assessment Engine:</strong> ScamShield AI uses local, rule-based 
          synthetic heuristics for evaluation. No AWS cloud models, external AI APIs, automated bank transfers, 
          or phone-call interception features are connected.
        </p>
      </div>
    </aside>
  );
};
