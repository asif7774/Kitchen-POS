import React, { useState, useEffect, useRef } from 'react';
import { useBusinessSession } from '../../../contexts/BusinessSessionContext';
import { useAuthStore } from '../../../store/auth';
import { useToast } from '../../../hooks/useToast';
import { useModal } from '../../../hooks/useModal';
import { SvgIcon } from '../../atoms/svg-sprite-loader';
import Button from '../../atoms/button/button';
import { api } from '../../../lib/ipc';

const QuickActionsFAB: React.FC = () => {
  const { activeSession, startSession, closeSession } = useBusinessSession();
  const staff = useAuthStore(state => state.staff);
  const { showToast } = useToast();
  const { showModal, hideModal } = useModal();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Backup loading states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!activeSession) { return; }
    const startMs = new Date(`${activeSession.started_at}Z`).getTime();
    const compute = () => {
      const ms = performance.now() + performance.timeOrigin - startMs;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setElapsed(`${h}h ${m}m`);
    };
    const t0 = setTimeout(compute, 0);
    const id = setInterval(compute, 60000);
    return () => { clearInterval(id); clearTimeout(t0); };
  }, [activeSession]);

  useEffect(() => {
    if (!open) { return; }
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => { document.removeEventListener('mousedown', handleClick); };
  }, [open]);

  const handleStart = async () => {
    if (!staff) { return; }
    setLoading(true);
    const { ok, error } = await startSession(staff.id);
    setLoading(false);
    if (ok) {
      showToast({ message: 'Business day started', variant: 'success' });
      setOpen(false);
    } else {
      showToast({ message: error ?? 'Failed to start business day', variant: 'error' });
    }
  };

  const handleClose = async () => {
    if (!activeSession || !staff) { return; }
    setLoading(true);
    const { ok, error } = await closeSession(activeSession.id, staff.id);
    setLoading(false);
    if (ok) {
      showToast({ message: 'Business day closed', variant: 'success' });
      setOpen(false);
    } else {
      showToast({ message: error ?? 'Failed to close business day', variant: 'error' });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.backup.export({});
      if (res.success && res.data) {
        showToast({ message: `Backup saved to ${res.data}`, variant: 'success' });
        setOpen(false);
      } else {
        showToast({ message: res.error ?? 'Failed to export backup', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
    setIsExporting(false);
  };

  const handleImport = () => {
    showModal({
      title: 'Import Backup',
      content: (
        <p className="text-sm text-gray-600">Warning: Importing a backup will overwrite ALL current data and close the app. Continue?</p>
      ),
      actions: (
        <>
          <Button variant="secondary" onClick={hideModal}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            hideModal();
            setIsImporting(true);
            api.backup.import({}).then(res => {
              if (!res.success && res.error !== 'Cancelled') {
                showToast({ message: res.error ?? 'Failed to import backup', variant: 'error' });
              }
              setIsImporting(false);
            }).catch((e: unknown) => {
              console.error(e);
              showToast({ message: 'An unexpected error occurred', variant: 'error' });
              setIsImporting(false);
            });
          }}>
            Yes, Import
          </Button>
        </>
      )
    });
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          <div className={`px-4 py-3 border-b ${activeSession ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-gray-800">Business Day</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeSession ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {activeSession ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            {activeSession ? (
              <>
                <InfoRow label="Business Date" value={activeSession.business_date} />
                <InfoRow label="Started At" value={new Date(`${activeSession.started_at}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                <InfoRow label="Duration" value={elapsed} />
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    variant="danger"
                    className="w-full justify-center"
                    onClick={() => { void handleClose(); }}
                    disabled={loading}
                  >
                    {loading ? 'Closing...' : 'Close Business Day'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">No active business day. Start one to track daily sales.</p>
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => { void handleStart(); }}
                  disabled={loading || !staff}
                >
                  {(() => {
                    if (loading) { return 'Starting...'; }
                    if (!staff) { return 'Login required to start'; }
                    return 'Start Business Day';
                  })()}
                </Button>
              </>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <span className="font-semibold text-xs text-gray-600 uppercase tracking-wider block mb-2">Data & Backups</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs" 
                onClick={() => { handleExport().catch(console.error); }} 
                disabled={isExporting || isImporting}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" 
                onClick={() => { handleImport(); }} 
                disabled={isExporting || isImporting}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); }}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          activeSession
            ? 'bg-green-500 hover:bg-green-600 focus-visible:ring-green-500 text-white'
            : 'bg-gray-700 hover:bg-gray-800 focus-visible:ring-gray-600 text-white'
        }`}
        aria-label={activeSession ? 'Business day active — view options' : 'No business day — click to start'}
        aria-expanded={open}
      >
        <SvgIcon name="calendar" width="22" height="22" stroke="currentColor" fill="none" aria-hidden />
      </button>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

export default QuickActionsFAB;
