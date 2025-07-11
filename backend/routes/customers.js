const express = require('express');
const router = express.Router();
const { Customer, ODP, Router, Area, Package } = require('../models');
const { sequelize } = require('../models');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [
        {
          model: ODP,
          as: 'odpData',
          attributes: ['id', 'name', 'location', 'area', 'totalSlots', 'usedSlots', 'availableSlots']
        },
        {
          model: Router,
          as: 'routerData',
          attributes: ['id', 'name', 'ipAddress', 'area']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: ODP,
          as: 'odpData',
          attributes: ['id', 'name', 'location', 'area', 'totalSlots', 'usedSlots', 'availableSlots']
        },
        {
          model: Router,
          as: 'routerData',
          attributes: ['id', 'name', 'ipAddress', 'area']
        }
      ]
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const customerData = req.body;
    
    // Jika ada odpId, cek dan update slot
    if (customerData.odpId) {
      const odp = await ODP.findByPk(customerData.odpId, { transaction });
      
      if (!odp) {
        await transaction.rollback();
        return res.status(400).json({ error: 'ODP tidak ditemukan' });
      }
      
      if (odp.availableSlots <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Slot ODP sudah penuh' });
      }
      
      // Update slot ODP
      await odp.update({
        usedSlots: odp.usedSlots + 1,
        availableSlots: odp.availableSlots - 1
      }, { transaction });
    }
    
    // Generate customer number
    const count = await Customer.count({ transaction });
    customerData.customerNumber = 'LTS' + (count + 1).toString().padStart(4, '0');
    
    const customer = await Customer.create(customerData, { transaction });
    
    // Fetch customer with relations
    const customerWithRelations = await Customer.findByPk(customer.id, {
      include: [
        {
          model: ODP,
          as: 'odpData',
          attributes: ['id', 'name', 'location', 'area', 'totalSlots', 'usedSlots', 'availableSlots']
        },
        {
          model: Router,
          as: 'routerData',
          attributes: ['id', 'name', 'ipAddress', 'area']
        }
      ],
      transaction
    });
    
    await transaction.commit();
    res.status(201).json(customerWithRelations);
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const customer = await Customer.findByPk(req.params.id, { transaction });
    
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }
    
    const customerData = req.body;
    const oldOdpId = customer.odpId;
    const newOdpId = customerData.odpId;
    
    // Handle ODP slot changes
    if (oldOdpId !== newOdpId) {
      // Kembalikan slot ODP lama
      if (oldOdpId) {
        const oldOdp = await ODP.findByPk(oldOdpId, { transaction });
        if (oldOdp) {
          await oldOdp.update({
            usedSlots: Math.max(0, oldOdp.usedSlots - 1),
            availableSlots: Math.min(oldOdp.totalSlots, oldOdp.availableSlots + 1)
          }, { transaction });
        }
      }
      
      // Kurangi slot ODP baru
      if (newOdpId) {
        const newOdp = await ODP.findByPk(newOdpId, { transaction });
        
        if (!newOdp) {
          await transaction.rollback();
          return res.status(400).json({ error: 'ODP baru tidak ditemukan' });
        }
        
        if (newOdp.availableSlots <= 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Slot ODP baru sudah penuh' });
        }
        
        await newOdp.update({
          usedSlots: newOdp.usedSlots + 1,
          availableSlots: newOdp.availableSlots - 1
        }, { transaction });
      }
    }
    
    await customer.update(customerData, { transaction });
    
    // Fetch updated customer with relations
    const updatedCustomer = await Customer.findByPk(customer.id, {
      include: [
        {
          model: ODP,
          as: 'odpData',
          attributes: ['id', 'name', 'location', 'area', 'totalSlots', 'usedSlots', 'availableSlots']
        },
        {
          model: Router,
          as: 'routerData',
          attributes: ['id', 'name', 'ipAddress', 'area']
        }
      ],
      transaction
    });
    
    await transaction.commit();
    res.json(updatedCustomer);
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const customer = await Customer.findByPk(req.params.id, { transaction });
    
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Customer tidak ditemukan' });
    }
    
    // Jika customer terhubung dengan ODP, kembalikan slot
    if (customer.odpId) {
      const odp = await ODP.findByPk(customer.odpId, { transaction });
      if (odp) {
        await odp.update({
          usedSlots: Math.max(0, odp.usedSlots - 1),
          availableSlots: Math.min(odp.totalSlots, odp.availableSlots + 1)
        }, { transaction });
      }
    }
    
    await customer.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Customer berhasil dihapus' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;