const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all transactions with optional filters
router.get('/', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        
        const where = {};
        if (type) where.type = type;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                incomeSource: true,
                expenseCategory: true
            },
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction summary
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }
        });

        const summary = transactions.reduce((acc, transaction) => {
            if (!acc[transaction.type]) {
                acc[transaction.type] = { count: 0, total: 0 };
            }
            acc[transaction.type].count += 1;
            acc[transaction.type].total += parseFloat(transaction.amount);
            return acc;
        }, {});

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new transaction
router.post('/', async (req, res) => {
    try {
        const { type, amount, description, date, incomeSourceId, expenseCategoryId } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({ error: 'type, amount, and date are required' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                type,
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                incomeSourceId: incomeSourceId ? parseInt(incomeSourceId) : null,
                expenseCategoryId: expenseCategoryId ? parseInt(expenseCategoryId) : null
            },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transaction
router.put('/:id', async (req, res) => {
    try {
        const { type, amount, description, date, incomeSourceId, expenseCategoryId } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({ error: 'type, amount, and date are required' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: parseInt(req.params.id) },
            data: {
                type,
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                incomeSourceId: incomeSourceId ? parseInt(incomeSourceId) : null,
                expenseCategoryId: expenseCategoryId ? parseInt(expenseCategoryId) : null
            },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        await prisma.transaction.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
