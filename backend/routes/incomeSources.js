const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

// Get all income sources
router.get('/', async (req, res) => {
    try {
        const incomeSources = await prisma.incomeSource.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(incomeSources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get income source by ID
router.get('/:id', async (req, res) => {
    try {
        const incomeSource = await prisma.incomeSource.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!incomeSource) {
            return res.status(404).json({ error: 'Income source not found' });
        }
        res.json(incomeSource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new income source
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const incomeSource = await prisma.incomeSource.create({
            data: { name, description }
        });
        res.status(201).json(incomeSource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update income source
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const incomeSource = await prisma.incomeSource.update({
            where: { id: parseInt(req.params.id) },
            data: { name, description }
        });
        res.json(incomeSource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete income source
router.delete('/:id', async (req, res) => {
    try {
        await prisma.incomeSource.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Income source deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
