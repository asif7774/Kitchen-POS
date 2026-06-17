import { Button, Input } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { Expense } from '../../types/models';
import { Card } from '../../components/atoms/card';
import { useAuthStore } from '../../store/auth';
import ExpenseModal from './components/ExpenseModal';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const staff = useAuthStore(state => state.staff);

  const fetchExpenses = () => {
    void api.expenses.getAll({ start: startDate, end: endDate }).then(res => {
      if (res.success && res.data) {
        setExpenses(res.data);
      }
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveExpense = async (data: { date: string, category: string, amount: number, description: string }) => {
    const res = await api.expenses.create({
      ...data,
      staff_id: staff?.id,
    });
    if (res.success) {
      showToast({ message: 'Expense added successfully', variant: 'success' });
      hideModal();
      fetchExpenses();
    } else {
      showToast({ message: res.error ?? 'Failed to create expense', variant: 'error' });
      console.error('Failed to create expense:', res.error);
    }
  };

  const handleDelete = (id: number) => {
    showModal({
      title: "Delete Expense",
      content: (
        <p className="text-gray-600">
          Are you sure you want to delete this expense?
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
                const res = await api.expenses.delete({ id });
                if (res.success) {
                  showToast({ message: 'Expense deleted successfully', variant: 'success' });
                  fetchExpenses();
                } else {
                  showToast({ message: res.error ?? 'Failed to delete expense', variant: 'error' });
                  console.error('Failed to delete expense:', res.error);
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

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="container-responsive p-6 mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <Button variant="primary" onClick={() => {
          showModal({
            title: "Add Expense",
            content: <ExpenseModal onSave={data => { handleSaveExpense(data).catch(console.error); }} />,
            actions: (
              <>
                <Button variant="ghost" onClick={hideModal}>Cancel</Button>
                <Button type="submit" form="expense-form" variant="primary">Save Expense</Button>
              </>
            )
          });
        }}>
          + Add Expense
        </Button>
      </div>

      <Card className="p-4 border-gray-100 mb-6 flex-row gap-6 items-center shrink-0">
        <div className="w-40">
          <Input 
            type="date" 
            label="Start Date"
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); }}
          />
        </div>
        <div className="w-40">
          <Input 
            type="date" 
            label="End Date"
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); }}
          />
        </div>
        <div className="ml-auto bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-blue-800">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-900">₹{totalAmount.toFixed(2)}</p>
        </div>
      </Card>

      <Card className="flex-1 border-gray-100">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Description</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 overflow-y-auto">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No expenses found for this date range.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-800">{expense.date}</td>
                    <td className="px-6 py-4 text-gray-800">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-normal min-w-[200px]">
                      {expense.description ?? '-'}
                      {expense.staff_name && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                            Linked: {expense.staff_name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium text-right">₹{expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => { handleDelete(expense.id); }}
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

export default ExpensesPage;
