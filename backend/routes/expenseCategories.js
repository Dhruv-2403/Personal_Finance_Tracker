const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get all expense categories
router.get('/', auth, async (req, res) => {
    try {
        const expenseCategories = await prisma.expenseCategory.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(expenseCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get expense category by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const expenseCategory = await prisma.expenseCategory.findFirst({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            }
        });
        if (!expenseCategory) {
            return res.status(404).json({ error: 'Expense category not found' });
        }
        res.json(expenseCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new expense category
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const expenseCategory = await prisma.expenseCategory.create({
            data: { name, description, userId: req.user.userId }
        });
        res.status(201).json(expenseCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update expense category
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const expenseCategory = await prisma.expenseCategory.updateMany({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            },
            data: { name, description }
        });
        if (expenseCategory.count === 0) {
            return res.status(404).json({ error: 'Expense category not found' });
        }
        const updated = await prisma.expenseCategory.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete expense category
router.delete('/:id', auth, async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { force } = req.query;

        const category = await prisma.expenseCategory.findFirst({
            where: { id: categoryId, userId: req.user.userId },
            include: { transactions: { take: 1 } }
        });

        if (!category) {
            return res.status(404).json({ error: 'Expense category not found' });
        }

        const transactionCount = await prisma.transaction.count({
            where: { expenseCategoryId: categoryId }
        });

        if (transactionCount > 0 && !force) {
            return res.status(400).json({
                error: `Category has ${transactionCount} transactions. Use ?force=true to delete and unlink transactions, or reassign them first.`,
                transactions: transactionCount
            });
        }

        await prisma.expenseCategory.delete({
            where: { id: categoryId }
        });

        res.json({
            message: 'Expense category deleted successfully',
            unlinkedTransactions: transactionCount > 0 ? transactionCount : undefined
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
