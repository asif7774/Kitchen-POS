import { Button } from "../../components/atoms";
import React, { useState } from "react";
import { useBackupActions } from "../../hooks/useBackupActions";
import { useModal } from "../../hooks/useModal";
import PinPad from "./components/PinPad";
import RecoveryModal from "./components/RecoveryModal";

const LoginPage: React.FC = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const { exportBackup, importBackup, isExporting, isImporting } =
    useBackupActions();
  const { showModal, hideModal } = useModal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-yellow-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-300/20 rounded-full blur-3xl" />

      {/* Main Content */}
      <div className="z-10 w-full flex flex-col items-center gap-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-emerald-500/10 border border-emerald-100 mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <img
              src="/icon.png"
              alt="Kitchen POS Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
            Kitchen POS
          </h1>
          <p className="text-gray-500 font-medium">Fast. Simple. Efficient.</p>
        </div>

        <PinPad />

        {/* Footer actions */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => {
              setIsRecovering(true);
            }}
          >
            Forgot PIN?
          </Button>

          <div className="flex gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-white/20 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || isImporting}
              onClick={() => {
                void exportBackup();
              }}
              className="bg-white/60 hover:bg-white"
            >
              {isExporting ? "Exporting... Do not close" : "Export Backup"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || isImporting}
              onClick={() => {
                showModal({
                  title: "Import Backup",
                  content: (
                    <p className="text-sm text-gray-600">
                      Warning: Importing a backup will overwrite ALL current
                      data and close the app. Continue?
                    </p>
                  ),
                  actions: (
                    <>
                      <Button variant="secondary" onClick={hideModal}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          hideModal();
                          void importBackup();
                        }}
                      >
                        Yes, Import
                      </Button>
                    </>
                  ),
                });
              }}
              className="bg-white/60 hover:bg-white"
            >
              {isImporting ? "Importing... Do not close" : "Import Backup"}
            </Button>
          </div>
        </div>
      </div>

      {isRecovering && (
        <RecoveryModal
          onClose={() => {
            setIsRecovering(false);
          }}
        />
      )}
    </div>
  );
};

export default LoginPage;
