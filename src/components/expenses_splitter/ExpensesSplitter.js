import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import React, { useState, useMemo, useEffect } from "react";
import {
    Grid,
    TextField,
    Button,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Alert,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    IconButton,
    useMediaQuery,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip
} from "@mui/material";
import { GroupAddIcon, GroupRemoveIcon } from './muiIcons';
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HistoryIcon from '@mui/icons-material/History';

export default function ExpnesesSplitter() {
    const [peopleDialog, setPeopleDialog] = useState({ open: false, people: [], desc: '' });
    const openPeopleDialog = (people, desc) => setPeopleDialog({ open: true, people, desc });
    const closePeopleDialog = () => setPeopleDialog({ ...peopleDialog, open: false });
    // Payment breakdown dialog state
    const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
    const [breakdownData, setBreakdownData] = useState({ debtor: '', to: '', amount: 0, expenses: [] });
    const [showPeopleManager, setShowPeopleManager] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [people, setPeople] = useState(() => {
        const saved = localStorage.getItem("expenses_splitter_people");
        return saved ? JSON.parse(saved) : ["cherry", "chitti"];
    });
    const [newPerson, setNewPerson] = useState("");
    const [amount, setAmount] = useState("");
    const [desc, setDesc] = useState("");
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [payer, setPayer] = useState("");
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem("expenses_splitter_expenses");
        return saved ? JSON.parse(saved) : [];
    });
    const [editingIdx, setEditingIdx] = useState(null);
    const [warning, setWarning] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const showFlash = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 2000);
    };
    const [filterText, setFilterText] = useState("");
    const [showFinalPayments, setShowFinalPayments] = useState(false);
    const [settlementView, setSettlementView] = useState('list'); // 'card' or 'list'
    const [showHistory, setShowHistory] = useState(false);

    // Scroll to top when settlement summary or history is opened
    useEffect(() => {
        if (showFinalPayments || showHistory) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [showFinalPayments, showHistory]);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [deletedHistory, setDeletedHistory] = useState(() => {
        const saved = localStorage.getItem("expenses_splitter_deleted_history");
        return saved ? JSON.parse(saved) : [];
    });
    const [clearedHistory, setClearedHistory] = useState(() => {
        const saved = localStorage.getItem("expenses_splitter_cleared_history");
        return saved ? JSON.parse(saved) : [];
    });
    
    // Save expenses and people to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("expenses_splitter_expenses", JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        localStorage.setItem("expenses_splitter_people", JSON.stringify(people));
    }, [people]);

    const handlePersonClick = (person) => {
        setSelectedPeople((prev) =>
            prev.includes(person)
                ? prev.filter((p) => p !== person)
                : [...prev, person]
        );
    };

    const addOrEditExpense = () => {
        if (people.length === 0) {
            setWarning("Add at least one person!");
            return;
        }
        if (selectedPeople.length === 0) {
            setWarning("Select at least one person!");
            return;
        }
        if (!amount || amount <= 0) {
            setWarning("Enter a valid amount!");
            return;
        }
        if (!payer) {
            setWarning("Select who paid the amount!");
            return;
        }
        if (!selectedPeople.includes(payer)) {
            setWarning("Payer must be among selected people!");
            return;
        }
        setWarning("");
        const expenseDesc = desc.trim() === "" ? "Item Desc" : desc.trim();
        const expenseData = {
            amount: parseFloat(amount),
            desc: expenseDesc,
            people: [...selectedPeople],
            payer,
            date: new Date().toLocaleString(),
        };
        if (editingIdx !== null) {
            expenses[editingIdx] = expenseData;
            setExpenses([...expenses]);
            setEditingIdx(null);
            showFlash("Expense updated successfully!");
        } else {
            setExpenses([...expenses, expenseData]);
            showFlash("Expense added successfully!");
        }
        setAmount("");
        setDesc("");
        setSelectedPeople([]);
        setPayer("");
    };

    const startEdit = (idx) => {
        const exp = expenses[idx];
        setEditingIdx(idx);
        setAmount(exp.amount);
        setDesc(exp.desc);
        setSelectedPeople(exp.people);
        setPayer(exp.payer);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteExpense = (idx) => {
        const deleted = expenses[idx];
        const updatedHistory = [deleted, ...deletedHistory];
        setDeletedHistory(updatedHistory);
        localStorage.setItem("expenses_splitter_deleted_history", JSON.stringify(updatedHistory));
        const newExpenses = expenses.filter((_, i) => i !== idx);
        setExpenses(newExpenses);
        showFlash("Expense deleted successfully!");
        if (editingIdx === idx) {
            setEditingIdx(null);
            setAmount("");
            setDesc("");
            setSelectedPeople([]);
            setPayer("");
        }
    };
    useEffect(() => {
        localStorage.setItem("expenses_splitter_deleted_history", JSON.stringify(deletedHistory));
    }, [deletedHistory]);
    
    useEffect(() => {
        localStorage.setItem("expenses_splitter_cleared_history", JSON.stringify(clearedHistory));
    }, [clearedHistory]);

    // Filter expenses by description, people or payer
    const filteredExpenses = useMemo(() => {
        if (!filterText.trim()) return expenses;
        const lower = filterText.toLowerCase();
        return expenses.filter(
            (e) =>
                e.payer.toLowerCase().includes(lower)
        );
    }, [expenses, filterText]);

    // Calculate total amount of filtered expenses
    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    // Calculate net amount per person (owed - paid)
    const netAmounts = people.reduce((acc, person) => {
        let owed = 0;
        let paid = 0;
        expenses.forEach((expense) => {
            if (expense.people.includes(person)) {
                owed += expense.amount / expense.people.length;
            }
            if (expense.payer === person) {
                paid += expense.amount;
            }
        });
        acc[person] = parseFloat((owed - paid).toFixed(2));
        return acc;
    }, {});

    // Helper to capitalize first letter of each word
    const capitalize = (str) =>
        typeof str === 'string' ? str.replace(/\b\w/g, (c) => c.toUpperCase()) : '';

    return (
        <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f7fa', boxSizing: 'border-box' }}>
            {!showFinalPayments && !showHistory && (
                <Grid
                    container
                    spacing={3}
                    sx={{ height: "100%", flex: "column" }}
                    wrap={isMobile ? "wrap" : "nowrap"}
                >
                    {/* Left column - Add/Edit (fixed width on desktop, full width on mobile) */}
                    <Grid
                        item
                        xs={12}
                        md={7}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            width: isMobile ? "100%" : "30%",
                        }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                pb: 5,
                                display: "flex",
                                flexDirection: "column",
                                overflowY: "auto",
                                boxSizing: "border-box",
                                height: "100%",
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Add / Edit Expense
                            </Typography>
                            <TextField
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                                title="Enter the total expense amount"
                            />
                            <TextField
                                label="Description"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                                title="Describe the expense item"
                            />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: "space-between",  mb: 1 }}>
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography variant="subtitle1" sx={{ mr: 2 }}>
                                    Select People to Expense
                                </Typography>
                                <Tooltip title={selectedPeople.length === people.length ? 'Deselect All' : 'Select All'}>
                                    <IconButton
                                        onClick={() => {
                                            if (selectedPeople.length === people.length) {
                                                setSelectedPeople([]);
                                            } else {
                                                setSelectedPeople(people);
                                            }
                                        }}
                                        sx={{ minWidth: 36 }}
                                    >
                                        {selectedPeople.length === people.length ? (
                                            <GroupRemoveIcon />
                                        ) : (
                                            <GroupAddIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                </Box>
                                <Tooltip title="Modify People">
                                    <IconButton
                                        color="primary"
                                        onClick={() => setShowPeopleManager(true)}
                                        sx={{ ml: 2 }}
                                    >
                                        <ManageAccountsIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {/* People buttons container with fixed width and wrap */}
                            <Box
                                sx={{
                                    mb: 2,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1,
                                    width: "100%",
                                    maxWidth: "400px"
                                }}
                            >
                                {people.map((person) => (
                                    <Box key={person} sx={{ position: "relative", maxWidth: "48%", mb: 1 }}>
                                        <Button
                                            variant={
                                                selectedPeople.includes(person)
                                                    ? "contained"
                                                    : "outlined"
                                            }
                                            onClick={() => handlePersonClick(person)}
                                            size="small"
                                            sx={{
                                                minWidth: 70,
                                                whiteSpace: "normal",
                                                wordBreak: "break-word",
                                                textAlign: "center",
                                                paddingLeft: 1,
                                                paddingRight: 2,
                                                lineHeight: 1.2,
                                                boxSizing: "border-box",
                                                width: "100%",
                                                position: "relative"
                                            }}
                                            title="Click to select/deselect this person for the expense"
                                        >
                                            {capitalize(person)}
                                        </Button>

                                    </Box>
                                ))}
                            </Box>

                            <FormControl fullWidth sx={{ mb: 2 }} title="Select who paid for the expense">
                                <InputLabel id="payer-label">Who Paid?</InputLabel>
                                <Select
                                    labelId="payer-label"
                                    value={payer}
                                    label="Who Paid?"
                                    onChange={(e) => setPayer(e.target.value)}
                                    disabled={selectedPeople.length === 0}
                                    title="Choose the person who paid for this expense"
                                >
                                    {selectedPeople.map((person) => (
                                        <MenuItem key={person} value={person}>
                                            {capitalize(person)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {warning && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {warning}
                                </Alert>
                            )}
                            {successMsg && (
                                <Box sx={{ position: 'fixed', top: 24, left: 0, right: 0, zIndex: 1300, display: 'flex', justifyContent: 'center' }}>
                                    <Alert severity="success" sx={{ width: 'fit-content', minWidth: 250, textAlign: 'center', boxShadow: 3 }}>
                                        {successMsg}
                                    </Alert>
                                </Box>
                            )}

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={addOrEditExpense}
                                title={editingIdx !== null ? "Update the selected expense" : "Add a new expense"}
                            >
                                {editingIdx !== null ? "Update Expense" : "Add Expense"}
                            </Button>

                            {/* People Manager Section (Dialog) */}
                            <Dialog open={showPeopleManager} onClose={() => setShowPeopleManager(false)}>
                                <DialogTitle>Modify People</DialogTitle>
                                <DialogContent>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 300, minHeight: 400 }}>
                                        <TextField
                                            label="Add New Person"
                                            value={newPerson}
                                            onChange={(e) => setNewPerson(e.target.value)}
                                            size="small"
                                            fullWidth
                                            title="Type a name and click Add to add a new person"
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => {
                                                const trimmed = newPerson.trim();
                                                if (trimmed && !people.includes(trimmed)) {
                                                    setPeople([...people, trimmed]);
                                                    setNewPerson("");
                                                }
                                            }}
                                            disabled={!newPerson.trim() || people.includes(newPerson.trim())}
                                            title="Add this person to the list"
                                        >
                                            Add Person
                                        </Button>
                                        <Typography variant="subtitle1" sx={{ mt: 2 }}>Current People</Typography>
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, overflowY: "auto", maxHeight: "250px" }}>
                                            {people.length === 0 && (
                                                <Typography variant="body2" color="text.secondary">No people added yet.</Typography>
                                            )}
                                            {people.map((person) => (
                                                <Box key={person} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee", py: 1 }}>
                                                    <Typography>{capitalize(person)}</Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        aria-label={`remove ${person}`}
                                                        onClick={() => {
                                                            setPeople((prev) => prev.filter((p) => p !== person));
                                                            setSelectedPeople((prev) => prev.filter((p) => p !== person));
                                                            if (payer === person) setPayer("");
                                                        }}
                                                        title="Remove this person from the list"
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setShowPeopleManager(false)} color="primary">Close</Button>
                                </DialogActions>
                            </Dialog>
                        </Paper>
                    </Grid>

                    {/* Right column - Expenses Table and Deleted History */}
                    <Grid container item xs={12} md={7} spacing={2} sx={{ height: "100%", width: isMobile ? "100%" : "70%" }}>
                        <Grid item xs={12} md={7} sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
                            <Paper
                                sx={{
                                    p: 2,
                                    overflowY: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                    boxSizing: "border-box",
                                }}
                            >
                                <Box
                                    sx={{
                                        mb: 2,
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 1,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ flexGrow: 1, minWidth: 120 }}>
                                        Expenses
                                    </Typography>

                                    <Box sx={{flexGrow: isMobile ? 0 : 1 }}>
                                        <Tooltip title="Show Final Payments">
                                            <IconButton
                                                color="primary"
                                                onClick={() => setShowFinalPayments(true)}
                                                disabled={expenses.length === 0}
                                                sx={{ mx: 1 }}
                                            >
                                                <ReceiptLongOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Clear All Data">
                                            <IconButton
                                                color="error"
                                                onClick={() => setClearDialogOpen(true)}
                                                disabled={expenses.length === 0}
                                                sx={{ mx: 1 }}
                                            >
                                                <DeleteForeverIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="History">
                                            <IconButton
                                                color="secondary"
                                                onClick={() => setShowHistory(true)}
                                                sx={{ mx: 1 }}
                                            >
                                                <HistoryIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Typography variant="subtitle1" sx={{ minWidth: 120 }}>
                                        Total: ₹ <b sx={{ fontWeight: 600 }}>{totalAmount.toFixed(2)}</b>
                                    </Typography>

                                </Box>
                                <TextField
                                    placeholder="Filter by payer"
                                    variant="outlined"
                                    size="small"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    sx={{ mb: 1 }}
                                    fullWidth
                                />
                                {/* Tooltip removed */}
                                <Table size="small" stickyHeader sx={{ flexShrink: 0 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Description</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>People</TableCell>
                                            <TableCell>Paid By</TableCell>
                                            <TableCell>Share Each</TableCell>
                                            <TableCell sx={{ textAlign: "center" }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredExpenses.map((expense, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{capitalize(expense.desc)}</TableCell>
                                                <TableCell>{expense.amount}</TableCell>
                                                <TableCell sx={{ flexWrap: "wrap", maxWidth: "200px" }}>
                                                    {isMobile
                                                        ? (
                                                            <>
                                                                {capitalize(expense.people[0])}
                                                                {expense.people.length > 1 && (
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ verticalAlign: 'middle', color: 'primary.main', ml: 0.5 }}
                                                                        onClick={() => openPeopleDialog(expense.people, expense.desc)}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 13, marginRight: 2 }}>+{expense.people.length - 1}</span>
                                                                        </Box>
                                                                    </IconButton>
                                                                )}
                                                            </>
                                                        )
                                                        : (
                                                            expense.people.length <= 3 ? (
                                                                expense.people.map(capitalize).join(", ")
                                                            ) : (
                                                                <>
                                                                    {capitalize(expense.people[0])}, {capitalize(expense.people[1])}, {capitalize(expense.people[2])}
                                                                    <IconButton
                                                                        size="medium"
                                                                        sx={{ verticalAlign: 'middle', color: 'primary.main' }}
                                                                        onClick={() => openPeopleDialog(expense.people, expense.desc)}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 14, marginRight: 2 }}>+{expense.people.length - 3}</span>
                                                                        </Box>
                                                                    </IconButton>
                                                                </>
                                                            )
                                                        )
                                                    }
                                                </TableCell>
                                                {/* ...existing code... */}
                                                <TableCell>{capitalize(expense.payer)}</TableCell>
                                                <TableCell>
                                                    {(expense.amount / expense.people.length).toFixed(2)}
                                                </TableCell>
                                                <TableCell sx={{ textAlign: "center" }}>

                                                    <IconButton
                                                        size="small"
                                                        color="warning"
                                                        onClick={() => startEdit(idx)}
                                                        aria-label="edit"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>


                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => deleteExpense(idx)}
                                                        aria-label="delete"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>

                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredExpenses.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    No matching expenses found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            )}

            {showFinalPayments && (
                <Paper sx={{ p: 3, pb: 5, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                        Settlement Summary
                    </Typography>
                    <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                        <Button
                            variant={settlementView === 'card' ? 'contained' : 'outlined'}
                            onClick={() => setSettlementView('card')}
                        >
                            Card View
                        </Button>
                        <Button
                            variant={settlementView === 'list' ? 'contained' : 'outlined'}
                            onClick={() => setSettlementView('list')}
                        >
                            List View
                        </Button>
                    </Box>
                    {/* <Typography variant="subtitle1" sx={{ mb: 2, color: "text.secondary" }}>
                        Below are the payments needed to settle up. Each card shows who should pay whom and how much. For each expense, you can see the item, who paid, who shared, and each person's share.
                    </Typography> */}
                    {expenses.length === 0 && (
                        <Typography>No expenses to settle.</Typography>
                    )}
                    {expenses.length > 0 && (
                        <Box sx={{ width: "100%", mx: "auto", mt: 2 }}>
                            {/* <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Individual Payment {settlementView === 'card' ? 'Cards' : 'List'}</Typography> */}
                            {(() => {
                                const debtors = [];
                                const creditors = [];
                                Object.entries(netAmounts).forEach(([person, amount]) => {
                                    if (amount > 0) {
                                        debtors.push({ person, amount });
                                    } else if (amount < 0) {
                                        creditors.push({ person, amount: -amount });
                                    }
                                });
                                const settlements = [];
                                let i = 0, j = 0;
                                while (i < debtors.length && j < creditors.length) {
                                    const debtor = debtors[i];
                                    const creditor = creditors[j];
                                    const minAmount = Math.min(debtor.amount, creditor.amount);
                                    settlements.push({
                                        from: debtor.person,
                                        to: creditor.person,
                                        amount: minAmount,
                                    });
                                    debtor.amount -= minAmount;
                                    creditor.amount -= minAmount;
                                    if (debtor.amount === 0) i++;
                                    if (creditor.amount === 0) j++;
                                }
                                if (settlements.length === 0) {
                                    return <Typography sx={{ mt: 2 }}>All settled up! No payments needed.</Typography>;
                                }
                                // For each debtor, show a card or list with all payments they need to make
                                const paymentsByDebtor = {};
                                settlements.forEach(({ from, to, amount }) => {
                                    if (!paymentsByDebtor[from]) paymentsByDebtor[from] = [];
                                    paymentsByDebtor[from].push({ to, amount });
                                });
                                if (settlementView === 'card') {
                                    return (
                                        <>
                                            <Box sx={{ width: "100%", mx: "auto", mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                {Object.entries(paymentsByDebtor).map(([debtor, payments], idx) => (
                                                    <Paper key={idx} elevation={3} sx={{ mb: 2, p: 2, width: isMobile ? "100%" : "30%", boxSizing: 'border-box' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{capitalize(debtor)}</Typography>
                                                        {payments.length > 1 ? (
                                                            <Table size="small" sx={{ mb: 2 }}>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>To</TableCell>
                                                                        <TableCell>Total Amount</TableCell>
                                                                        <TableCell>Breakdown</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {payments.map((pay, i) => {
                                                                        const relevantExpenses = expenses.filter(e => e.people.includes(debtor) && e.payer === pay.to);
                                                                        return (
                                                                            <TableRow key={i}>
                                                                                <TableCell>{capitalize(pay.to)}</TableCell>
                                                                                <TableCell>₹{pay.amount.toFixed(2)}</TableCell>
                                                                                <TableCell>
                                                                                    <Tooltip title="Show breakdown">
                                                                                        <IconButton size="small" onClick={() => {
                                                                                            setBreakdownData({ debtor, to: pay.to, amount: pay.amount, expenses: relevantExpenses });
                                                                                            setBreakdownDialogOpen(true);
                                                                                        }}>
                                                                                            <ReceiptLongOutlinedIcon fontSize="small" />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            payments.map((pay, i) => {
                                                                const relevantExpenses = expenses.filter(e => e.people.includes(debtor) && e.payer === pay.to);
                                                                return (
                                                                    <Box key={i} sx={{ mb: 2, gap: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                        <Typography variant="body1">
                                                                            To: <b>{capitalize(pay.to)}</b>
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            Total Amount to Pay: <b>₹{pay.amount.toFixed(2)}</b>
                                                                            <Tooltip title="Show breakdown">
                                                                                <IconButton size="small" sx={{ ml: 1 }} onClick={() => {
                                                                                    setBreakdownData({ debtor, to: pay.to, amount: pay.amount, expenses: relevantExpenses });
                                                                                    setBreakdownDialogOpen(true);
                                                                                }}>
                                                                                    <ReceiptLongOutlinedIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Typography>
                                                                    </Box>
                                                                );
                                                            })
                                                        )}
                                                    </Paper>
                                                ))}
                                            </Box>
                                            <Dialog open={breakdownDialogOpen} onClose={() => setBreakdownDialogOpen(false)}>
                                                <DialogTitle>Payment Breakdown</DialogTitle>
                                                <DialogContent>
                                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                        {capitalize(breakdownData.debtor)} pays {capitalize(breakdownData.to)}: ₹{breakdownData.amount.toFixed(2)}
                                                    </Typography>
                                                    <Table size="small" sx={{ mb: 2 }}>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Description</TableCell>
                                                                <TableCell>Share for {capitalize(breakdownData.debtor)}</TableCell>
                                                                <TableCell>Paid By</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {expenses.filter(exp => exp.people.includes(breakdownData.debtor)).map((exp, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{capitalize(exp.desc)}</TableCell>
                                                                    <TableCell>₹{(exp.amount / exp.people.length).toFixed(2)}</TableCell>
                                                                    <TableCell>{capitalize(exp.payer)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 600 }}>Net Amount to Pay</TableCell>
                                                                <TableCell colSpan={2} sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                                    ₹{
                                                                        expenses
                                                                            .filter(exp => exp.people.includes(breakdownData.debtor))
                                                                            .reduce((sum, exp) => sum + (exp.amount / exp.people.length), 0)
                                                                            .toFixed(2)
                                                                    }
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </DialogContent>
                                                <DialogActions>
                                                    <Button onClick={() => setBreakdownDialogOpen(false)} color="primary">Close</Button>
                                                </DialogActions>
                                            </Dialog>
                                        </>
                                    );
                                } else {
                                    // List view
                                    return (
                                        <Box sx={{ width: isMobile ? "100%" : 700, mx: "auto", mt: 2 }}>
                                            <Table size="small" sx={{ mb: 2 }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>From</TableCell>
                                                        <TableCell>To</TableCell>
                                                        <TableCell>Total Amount</TableCell>
                                                        <TableCell>Breakdown</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {Object.entries(paymentsByDebtor).map(([debtor, payments], idx) => (
                                                        payments.length > 1 ? (
                                                            <TableRow key={debtor + '-main'}>
                                                                <TableCell colSpan={4} sx={{ fontWeight: 600 }}>
                                                                    {capitalize(debtor)} needs to pay multiple people:
                                                                    <Table size="small" sx={{ mt: 1, mb: 1 }}>
                                                                        <TableHead >
                                                                            <TableRow >
                                                                                <TableCell>To</TableCell>
                                                                                <TableCell>Total Amount</TableCell>
                                                                                <TableCell>Breakdown</TableCell>
                                                                            </TableRow>
                                                                        </TableHead>
                                                                        <TableBody>
                                                                            {payments.map((pay, i) => {
                                                                                const relevantExpenses = expenses.filter(e => e.people.includes(debtor) && e.payer === pay.to);
                                                                                return (
                                                                                    <TableRow key={debtor + '-' + i}>
                                                                                        <TableCell>{capitalize(pay.to)}</TableCell>
                                                                                        <TableCell>₹{pay.amount.toFixed(2)}</TableCell>
                                                                                        <TableCell>
                                                                                            <Tooltip title="Show breakdown">
                                                                                                <IconButton size="small" onClick={() => {
                                                                                                    setBreakdownData({ debtor, to: pay.to, amount: pay.amount, expenses: relevantExpenses });
                                                                                                    setBreakdownDialogOpen(true);
                                                                                                }}>
                                                                                                    <ReceiptLongOutlinedIcon fontSize="small" />
                                                                                                </IconButton>
                                                                                            </Tooltip>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                );
                                                                            })}
                                                                        </TableBody>
                                                                    </Table>
                                                                </TableCell>
                                                            </TableRow>
                                                        ) : (
                                                            payments.map((pay, i) => {
                                                                const relevantExpenses = expenses.filter(e => e.people.includes(debtor) && e.payer === pay.to);
                                                                return (
                                                                    <TableRow key={debtor + '-' + i}>
                                                                        <TableCell>{capitalize(debtor)}</TableCell>
                                                                        <TableCell>{capitalize(pay.to)}</TableCell>
                                                                        <TableCell>₹{pay.amount.toFixed(2)}</TableCell>
                                                                        <TableCell>
                                                                            <Tooltip title="Show breakdown">
                                                                                <IconButton size="small" onClick={() => {
                                                                                    setBreakdownData({ debtor, to: pay.to, amount: pay.amount, expenses: relevantExpenses });
                                                                                    setBreakdownDialogOpen(true);
                                                                                }}>
                                                                                    <ReceiptLongOutlinedIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })
                                                        )
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <Dialog open={breakdownDialogOpen} onClose={() => setBreakdownDialogOpen(false)}>
                                                <DialogTitle>Payment Breakdown</DialogTitle>
                                                <DialogContent>
                                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                        {capitalize(breakdownData.debtor)} pays {capitalize(breakdownData.to)}: ₹{breakdownData.amount.toFixed(2)}
                                                    </Typography>
                                                    {breakdownData.expenses.length === 0 ? (
                                                        <Typography variant="body2">No shared expenses found for this payment.</Typography>
                                                    ) : (
                                                        <Table size="small" sx={{ mb: 2 }}>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Description</TableCell>
                                                                    <TableCell>Share</TableCell>
                                                                    <TableCell>Paid By</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {breakdownData.expenses.map((exp, idx) => (
                                                                    <TableRow key={idx}>
                                                                        <TableCell>{capitalize(exp.desc)}</TableCell>
                                                                        <TableCell>₹{(exp.amount / exp.people.length).toFixed(2)}</TableCell>
                                                                        <TableCell>{capitalize(exp.payer)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    )}
                                                </DialogContent>
                                                <DialogActions>
                                                    <Button onClick={() => setBreakdownDialogOpen(false)} color="primary">Close</Button>
                                                </DialogActions>
                                            </Dialog>
                                        </Box>
                                    );
                                }
                            })()}
                        </Box>
                    )}
                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowFinalPayments(false)}
                            title="Go back to add and view expenses"
                        >
                            Back to Adding & Expenses
                        </Button>
                    </Box>
                </Paper>
            )}

            {showHistory && (
                <Grid item xs={12} md={5} sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setShowHistory(false)}
                        sx={{ mb: 2 }}
                    >
                        Back to Adding & Expenses
                    </Button>
                    <Paper sx={{ p: 2, pb: 5, height: "100%", overflowY: "auto", boxSizing: "border-box", width: isMobile ? "100%" : "70%", }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6">
                                History
                            </Typography>
                            {deletedHistory.length > 0 || clearedHistory.length > 0 ? (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => {
                                        setDeletedHistory([]);
                                        setClearedHistory([]);
                                        localStorage.removeItem("expenses_splitter_deleted_history");
                                        localStorage.removeItem("expenses_splitter_cleared_history");
                                    }}
                                    disabled={deletedHistory.length === 0 && clearedHistory.length === 0}
                                >
                                    Delete History
                                </Button>
                            ) : null}
                        </Box>
                        {/* Always render the history tracker table */}
                        {deletedHistory.length === 0 && clearedHistory.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No deleted or cleared expenses yet.
                            </Typography>
                        ) : (
                            <>
                                {deletedHistory.length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Deleted Expenses</Typography>
                                        <Table size="small" sx={{ mb: 2 }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date & Time</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                    <TableCell>People</TableCell>
                                                    <TableCell>Share</TableCell>
                                                    <TableCell>Paid By</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {deletedHistory.map((expense, idx) => (
                                                    <TableRow key={"del-" + idx}>
                                                        <TableCell>{expense.date || expense.deletedAt || ""}</TableCell>
                                                        <TableCell>{capitalize(expense.desc)}</TableCell>
                                                        <TableCell>{expense.amount}</TableCell>
                                                        <TableCell>
                                                            {isMobile
                                                                ? (
                                                                    <>
                                                                        {capitalize(expense.people[0])}
                                                                        {expense.people.length > 1 && (
                                                                            <IconButton
                                                                                size="small"
                                                                                sx={{ verticalAlign: 'middle', color: 'primary.main', ml: 0.5 }}
                                                                                onClick={() => openPeopleDialog(expense.people, expense.desc)}
                                                                            >
                                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                    <span style={{ fontWeight: 600, fontSize: 13, marginRight: 2 }}>+{expense.people.length - 1}</span>
                                                                                </Box>
                                                                            </IconButton>
                                                                        )}
                                                                    </>
                                                                )
                                                                : (
                                                                    expense.people.length <= 2 ? (
                                                                        expense.people.map(capitalize).join(", ")
                                                                    ) : (
                                                                        <>
                                                                            {capitalize(expense.people[0])}, {capitalize(expense.people[1])}
                                                                            <IconButton
                                                                                size="medium"
                                                                                sx={{ verticalAlign: 'middle', color: 'primary.main' }}
                                                                                onClick={() => openPeopleDialog(expense.people, expense.desc)}
                                                                            >
                                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                                    <span style={{ fontWeight: 600, fontSize: 14, marginRight: 2 }}>+{expense.people.length - 2}</span>
                                                                                </Box>
                                                                            </IconButton>
                                                                        </>
                                                                    )
                                                                )
                                                            }
                                                        </TableCell>
                                                        <TableCell>{(expense.amount / expense.people.length).toFixed(2)}</TableCell>
                                                        <TableCell>{capitalize(expense.payer)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                                {clearedHistory.length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Cleared Expenses</Typography>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date & Time</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Amount</TableCell>
                                                    <TableCell>People</TableCell>
                                                    <TableCell>Share</TableCell>
                                                    <TableCell>Paid By</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {clearedHistory.map((expense, idx) => (
                                                    <TableRow key={"clr-" + idx}>
                                                        <TableCell>{expense.date || ""}</TableCell>
                                                        <TableCell>{capitalize(expense.desc)}</TableCell>
                                                        <TableCell>{expense.amount}</TableCell>
                                                        <TableCell>
                                                            {expense.people.length <= 2 ? (
                                                                expense.people.map(capitalize).join(", ")
                                                            ) : (
                                                                <>
                                                                    {capitalize(expense.people[0])}, {capitalize(expense.people[1])}
                                                                    <IconButton
                                                                        size="medium"
                                                                        sx={{ verticalAlign: 'middle', color: 'primary.main' }}
                                                                        onClick={() => openPeopleDialog(expense.people, expense.desc)}
                                                                    >
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 14, marginRight: 2 }}>+{expense.people.length - 2}</span>
                                                                        </Box>
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{(expense.amount / expense.people.length).toFixed(2)}</TableCell>
                                                        <TableCell>{capitalize(expense.payer)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </>
                        )}
                    </Paper>
                </Grid>
            )}

            {/* Clear All Data Confirmation Dialog */}
            <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
                <DialogTitle>Warning</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to clear all expenses data? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClearDialogOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (expenses.length > 0) {
                                const updatedCleared = [...expenses, ...clearedHistory];
                                setClearedHistory(updatedCleared);
                                localStorage.setItem("expenses_splitter_cleared_history", JSON.stringify(updatedCleared));
                            }
                            localStorage.removeItem("expenses_splitter_expenses");
                            setExpenses([]);
                            setClearDialogOpen(false);
                            showFlash("All expenses cleared!");
                        }}
                        color="error"
                    >
                        Clear All
                    </Button>
                </DialogActions>
            </Dialog>

            {/* People Names Dialog for +count hover (rendered once globally) */}
            <Dialog open={peopleDialog.open} onClose={closePeopleDialog}>
                <DialogTitle>
                    People in {peopleDialog.desc ? peopleDialog.desc : 'Expense'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ minWidth: 200, minHeight: 50, maxHeight: 400, overflowY: 'auto' }}>
                        {peopleDialog.people.map((name, idx) => (
                            <Typography key={idx} sx={{ mb: 1 }}>{capitalize(name)}</Typography>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closePeopleDialog} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
