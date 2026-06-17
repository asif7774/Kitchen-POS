import { Button, Autosearch } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { Staff } from '../../types/models';
import { Card } from '../../components/atoms/card';
import StaffModal from './components/StaffModal';
import { useModal } from '../../hooks/useModal';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  cashier: 'bg-green-100 text-green-800',
  waiter: 'bg-yellow-100 text-yellow-800',
  chef: 'bg-orange-100 text-orange-800',
  cleaner: 'bg-gray-100 text-gray-800'
};

const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { showModal, hideModal } = useModal();

  const fetchStaff = () => {
    void api.staff.getAll().then(res => {
      if (res.success && res.data) {
        setStaffList(res.data.filter(s => s.is_active));
      }
    });
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSaveStaff = async (data: Partial<Staff>) => {
    const res = await api.staff.upsert(data);
    if (res.success) {
      hideModal();
      fetchStaff();
    } else {
      console.error('Failed to save staff:', res.error);
    }
  };

  const handleDelete = (id: number) => {
    showModal({
      title: "Delete Staff",
      content: (
        <p className="text-gray-600">
          Are you sure you want to remove this staff member?
        </p>
      ),
      actions: (
        <>
          <Button variant="ghost" onClick={hideModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              void (async () => {
                const res = await api.staff.delete({ id });
                if (res.success) {
                  fetchStaff();
                } else {
                  console.error('Failed to delete staff:', res.error);
                }
                hideModal();
              })();
            }}
          >
            Delete
          </Button>
        </>
      ),
    });
  };

  const openAddModal = () => {
    showModal({
      title: "Add Staff",
      content: <StaffModal initialData={null} onSave={data => { handleSaveStaff(data).catch(console.error); }} />,
      actions: (
        <>
          <Button variant="ghost" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="staff-form" variant="primary">Save Staff</Button>
        </>
      )
    });
  };

  const openEditModal = (staff: Staff) => {
    showModal({
      title: "Edit Staff",
      content: <StaffModal initialData={staff} onSave={data => { handleSaveStaff(data).catch(console.error); }} />,
      actions: (
        <>
          <Button variant="ghost" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="staff-form" variant="primary">Save Staff</Button>
        </>
      )
    });
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchOptions = staffList.map(staff => ({
    value: String(staff.id),
    label: staff.name
  }));

  return (
    <div className="container-responsive p-6 mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-sm">
          <Autosearch
            placeholder="Search staff by name or role..."
            options={searchOptions}
            value={searchQuery}
            onChange={setSearchQuery}
            onSelectOption={(opt) => { setSearchQuery(opt.label); }}
          />
        </div>
        <Button variant="primary" onClick={openAddModal} className="ml-4">
          + Add Staff
        </Button>
      </div>

      <Card className="flex-1 border-gray-100">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No staff found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800 font-medium">{staff.name}</td>
                    <td className="px-6 py-4 text-gray-800">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[staff.role] || 'bg-gray-100 text-gray-800'}`}>
                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 mr-2"
                        onClick={() => { openEditModal(staff); }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { handleDelete(staff.id); }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StaffPage;
