import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  hasBack?: boolean;
  onBack?: () => void;
  showLivePill?: boolean;
  rightElement?: React.ReactNode;
  icon?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle = 'ClimateShield Citizen',
  hasBack = false,
  onBack,
  showLivePill = true,
  rightElement,
  icon = 'shield_with_heart',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe px-edge-margin-mobile">
      <div className="h-16 flex items-center justify-between mt-space-2xs px-space-md rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-space-xs min-w-0">
          {hasBack ? (
            <button
              aria-label="Go back"
              className="w-11 h-11 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shrink-0"
              onClick={handleBack}
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">{icon}</span>
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold truncate">
              {subtitle}
            </span>
            <h1 className="font-title-lg text-title-lg text-on-surface font-bold truncate tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-space-xs shrink-0">
          {rightElement ? (
            rightElement
          ) : (
            <>
              {showLivePill && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                  Live
                </span>
              )}
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WZa1gNvntWWeiT4QhM-l_fIhJeTNPgwhOocSm5zkFiyeUn3CdWKg2P6QBAp2739f4ineyLsZACoh0wcEewdNPLn7dJp1NR4H3lnvVimUYZHBtoiKTEcHeUelauAMp_CGDEiOGu2-Yqz4_Vqk5IejETJ6u1R9tsOCq5DwbAv411fFrUovtU623EzW2rGPgJX0iZQ2U-lv-rR-wRns1wPkTfcV5BBGcpGIRxWJQowEeXYjkRRS5BZt3IWUg"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
};
