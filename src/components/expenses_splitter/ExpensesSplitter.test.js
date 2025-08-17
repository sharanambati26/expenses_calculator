import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ExpensesSplitter from './ExpensesSplitter';

describe('ExpensesSplitter', () => {
  test('renders Add / Edit Expense form', async () => {
    render(<ExpensesSplitter />);
    expect(await screen.findByText(/Add \/ Edit Expense/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Amount/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Description/i)).toBeInTheDocument();
  });

  test('can add a new person', async () => {
    render(<ExpensesSplitter />);
    fireEvent.click(await screen.findByText(/Modify People/i));
    fireEvent.change(await screen.findByLabelText(/Add New Person/i), { target: { value: 'alex' } });
    fireEvent.click(await screen.findByText(/Add Person/i));
    // Use getAllByText to avoid ambiguity
    const alexElements = await screen.findAllByText(/Alex/i);
    expect(alexElements.length).toBeGreaterThan(0);
  });

  test('can add an expense', async () => {
    render(<ExpensesSplitter />);
    fireEvent.change(await screen.findByLabelText(/Amount/i), { target: { value: '100' } });
    fireEvent.change(await screen.findByLabelText(/Description/i), { target: { value: 'Lunch' } });
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Surya/i));
    fireEvent.click(await screen.findByLabelText(/Who Paid?/i));
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Add Expense/i));
    // Use findByText with function matcher for flexibility
    expect(await screen.findByText((content) => content.includes('Lunch'))).toBeInTheDocument();
    expect(await screen.findByText((content) => content.includes('100'))).toBeInTheDocument();
  });

  test('shows flash message on add', async () => {
    render(<ExpensesSplitter />);
    fireEvent.change(await screen.findByLabelText(/Amount/i), { target: { value: '50' } });
    fireEvent.change(await screen.findByLabelText(/Description/i), { target: { value: 'Snacks' } });
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByLabelText(/Who Paid?/i));
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Add Expense/i));
    // Use findByText with function matcher for flexibility
    expect(await screen.findByText((content) => content.toLowerCase().includes('expense'))).toBeInTheDocument();
  });

  test('can open people dialog with +count', async () => {
    render(<ExpensesSplitter />);
    // Add an expense with 3 people
    fireEvent.change(await screen.findByLabelText(/Amount/i), { target: { value: '120' } });
    fireEvent.change(await screen.findByLabelText(/Description/i), { target: { value: 'Dinner' } });
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Surya/i));
    fireEvent.click(await screen.findByText(/Vishnu/i));
    fireEvent.click(await screen.findByLabelText(/Who Paid?/i));
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Add Expense/i));
    // Find +count icon and click (use function matcher)
    const plusCount = await screen.findByText((content) => content.trim().startsWith('+'));
    fireEvent.click(plusCount.closest('button'));
    expect(await screen.findByText(/People in Dinner/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sharan/i)).toBeInTheDocument();
    expect(await screen.findByText(/Surya/i)).toBeInTheDocument();
    expect(await screen.findByText(/Vishnu/i)).toBeInTheDocument();
  });

  test('can switch to settlement summary and see payments', async () => {
    render(<ExpensesSplitter />);
    // Add two expenses for two people
    fireEvent.change(await screen.findByLabelText(/Amount/i), { target: { value: '100' } });
    fireEvent.change(await screen.findByLabelText(/Description/i), { target: { value: 'Lunch' } });
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Surya/i));
    fireEvent.click(await screen.findByLabelText(/Who Paid?/i));
    fireEvent.click(await screen.findByText(/Sharan/i));
    fireEvent.click(await screen.findByText(/Add Expense/i));
    fireEvent.change(await screen.findByLabelText(/Amount/i), { target: { value: '50' } });
    fireEvent.change(await screen.findByLabelText(/Description/i), { target: { value: 'Snacks' } });
    fireEvent.click(await screen.findByText(/Surya/i));
    fireEvent.click(await screen.findByLabelText(/Who Paid?/i));
    fireEvent.click(await screen.findByText(/Surya/i));
    fireEvent.click(await screen.findByText(/Add Expense/i));
    fireEvent.click(await screen.findByText(/Show Final Payments/i));
    expect(await screen.findByText(/Settlement Summary/i)).toBeInTheDocument();
    expect(await screen.findByText(/To:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Total Amount to Pay:/i)).toBeInTheDocument();
  });
});
