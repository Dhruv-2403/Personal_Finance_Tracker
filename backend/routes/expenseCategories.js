const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all expense categories
router.get('/', async (req, res) => {
    try {
        const expenseCategories = await prisma.expenseCategory.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(expenseCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get expense category by ID
router.get('/:id', async (req, res) => {
    try {
        const expenseCategory = await prisma.expenseCategory.findUnique({
            where: { id: parseInt(req.params.id) }
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
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const expenseCategory = await prisma.expenseCategory.create({
            data: { name, description }
        });
        res.status(201).json(expenseCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update expense category
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const expenseCategory = await prisma.expenseCategory.update({
            where: { id: parseInt(req.params.id) },
            data: { name, description }
        });
        res.json(expenseCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete expense category
router.delete('/:id', async (req, res) => {
    try {
        await prisma.expenseCategory.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Expense category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
