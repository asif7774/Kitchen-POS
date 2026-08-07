import React from 'react';
import DataAndBackupsCard from './components/DataAndBackupsCard';
import SecurityCard from './components/SecurityCard';
import PreferencesCard from './components/PreferencesCard';
import SystemCard from './components/SystemCard';
import ShiftRegisterCard from './components/ShiftRegisterCard';
import DangerZoneCard from './components/DangerZoneCard';

const SettingsPage: React.FC = () => {
  return (
    <div className="container-responsive p-6 max-w-2xl mx-auto relative">
      <div className="space-y-8">
        <DataAndBackupsCard />
        <SystemCard />
        <SecurityCard />
        <PreferencesCard />
        <ShiftRegisterCard />
        <DangerZoneCard />
      </div>
    </div>
  );
};

export default SettingsPage;
