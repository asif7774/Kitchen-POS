import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/ipc';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/atoms';
import Button from '../../components/atoms/button/button';

const SetupPage: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [adminPin, setAdminPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const checkSetup = useAuthStore(state => state.checkSetup);
  const navigate = useNavigate();

  const handleSetup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!restaurantName || !adminName || !adminPin) {
      showToast({ message: 'Please fill out all fields', variant: 'warning' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.system.completeSetup({ restaurantName, adminName, adminPin });
      if (res.success) {
        showToast({ message: 'Setup completed successfully', variant: 'success' });
        
        // Generate recovery code
        const codeRes = await api.system.generateRecoveryCode();
        if (codeRes.success) {
          showToast({ message: 'Recovery code saved successfully', variant: 'success' });
        } else {
          showToast({ message: 'Recovery code not saved. You can generate one later in Settings.', variant: 'warning' });
        }

        void checkSetup();
        navigate('/login');
      } else {
        showToast({ message: res.error ?? 'Setup failed', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Kitchen POS</h1>
          <p className="text-sm text-gray-500">Let's get your restaurant set up.</p>
        </div>

        <form onSubmit={(e) => { void handleSetup(e); }} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <Input 
              value={restaurantName} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setRestaurantName(e.target.value); }}
              placeholder="e.g. The Great Cafe"
              autoFocus
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Admin User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <Input 
                  value={adminName} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAdminName(e.target.value); }}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN (Login Code)</label>
                <Input 
                  type="password"
                  value={adminPin} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAdminPin(e.target.value); }}
                  placeholder="4-digit PIN"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  title="PIN must be exactly 4 digits"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full justify-center" 
              disabled={loading}
            >
              {loading ? 'Saving Setup...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Already have a backup?</p>
          <p className="mt-1">Use the quick actions button in the bottom right corner to import it.</p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
