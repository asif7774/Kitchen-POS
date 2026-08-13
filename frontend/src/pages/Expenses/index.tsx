import { Button, Input } from '../../components/atoms';
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/ipc';
import { Expense } from '../../types/models';
import { useBusinessSession } from '../../contexts/BusinessSessionContext';
import { Card } from '../../components/atoms/card';
import { useAuthStore } from '../../store/auth';
import ExpenseModal from './components/ExpenseModal';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { useHeader } from '../../contexts/HeaderContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/molecules/Table';
type FilterType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const filters: { label: string; value: FilterType }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<FilterType>("daily");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { activeSession } = useBusinessSession();

  const formatLocal = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  // Custom date range — only used when filter === "custom"
  const [startDate, setStartDate] = useState(formatLocal(new Date()));
  const [endDate, setEndDate] = useState(formatLocal(new Date()));

  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const staff = useAuthStore(state => state.staff);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  const fetchExpenses = useCallback(() => {
    let start = startDate;
    let end = endDate;

    if (filter !== 'custom') {
      const todayStr = activeSession?.business_date ?? formatLocal(new Date());
      end = todayStr;
      start = todayStr;
      if (filter === 'weekly') {
        const d = new Date(`${todayStr}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() - 6);
        start = d.toISOString().slice(0, 10);
      } else if (filter === 'monthly') {
        const d = new Date(`${todayStr}T12:00:00Z`);
        d.setUTCMonth(d.getUTCMonth() - 1);
        start = d.toISOString().slice(0, 10);
      } else if (filter === 'yearly') {
        const d = new Date(`${todayStr}T12:00:00Z`);
        d.setUTCFullYear(d.getUTCFullYear() - 1);
        start = d.toISOString().slice(0, 10);
      }
    }

    void api.expenses.getAll({ start, end }).then(res => {
      if (res.success && res.data) {
        setExpenses(res.data);
      }
    });
  }, [startDate, endDate, filter, activeSession]);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, fetchExpenses]);

  const handleSaveExpense = useCallback(async (data: { date: string, category: string, amount: number, description: string }) => {
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
  }, [staff?.id, showToast, hideModal, fetchExpenses]);

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

  const { setHeader } = useHeader();
  useEffect(() => {
    setHeader(
      'Expenses',
      <div className="flex items-center gap-4">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              onClick={() => {
                handleFilterChange(f.value);
                setShowDatePicker(false);
              }}
              className={
                filter === f.value
                  ? "bg-emerald-50 text-emerald-600 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
            }}
            className={
              filter === "custom"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : ""
            }
          >
            Custom Dates
          </Button>
          {showDatePicker && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 mb-2">Custom Range</h4>
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFilter("custom");
                }}
              />
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFilter("custom");
                }}
              />
              <Button
                variant="primary"
                onClick={() => {
                  setFilter("custom");
                  setShowDatePicker(false);
                }}
              >
                Apply Range
              </Button>
            </div>
          )}
        </div>
      </div>,
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
    );
    return () => { setHeader(null, null, null); };
  }, [filter, showDatePicker, startDate, endDate, setHeader, showModal, hideModal, handleSaveExpense, handleFilterChange]);

  return (
    <div className="container-responsive p-6 mx-auto h-full flex flex-col">

      <Card className="p-4 border-gray-100 mb-6 flex-row gap-6 justify-between items-center shrink-0">
        <h3 className="text-lg font-bold text-gray-800">Expense Overview</h3>
        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-blue-100">
          <p className="text-sm font-medium text-emerald-800">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-900">₹{totalAmount.toFixed(0)}</p>
        </div>
      </Card>

      <Card className="flex-1 border-gray-100 p-0">
        <Table className="h-full border-0 shadow-none sm:rounded-none">
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-y-auto">
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No expenses found for this date range.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-gray-800">{expense.date}</TableCell>
                  <TableCell className="text-gray-800">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 whitespace-normal min-w-[200px]">
                    {expense.description ?? '-'}
                    {expense.staff_name && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600">
                          Linked: {expense.staff_name}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-900 font-medium text-right">₹{expense.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { handleDelete(expense.id); }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ExpensesPage;
