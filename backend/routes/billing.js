const express = require('express');
const router = express.Router();
const { Customer, Transaction, AddonItem } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');

// Set default timezone ke Asia/Jakarta
moment.tz.setDefault('Asia/Jakarta');

// Helper function untuk mendapatkan waktu Jakarta
function getJakartaTime() {
  return moment.tz('Asia/Jakarta');
}

// Fungsi untuk menghitung prorata
function calculateProRata(activeDate, packagePrice, activePeriod, activePeriodUnit) {
  const now = getJakartaTime().toDate();
  const startDate = moment.tz(activeDate, 'Asia/Jakarta').toDate();
  
  if (activePeriodUnit === 'months') {
    // Hitung hari dalam bulan aktif
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - startDate.getDate() + 1;
    
    // Hitung prorata
    const dailyRate = packagePrice / daysInMonth;
    const proRataAmount = dailyRate * remainingDays;
    
    return {
      isProRataApplied: remainingDays < daysInMonth,
      proRataAmount: Math.round(proRataAmount),
      remainingDays,
      daysInMonth
    };
  }
  
  return {
    isProRataApplied: false,
    proRataAmount: packagePrice,
    remainingDays: activePeriod,
    daysInMonth: activePeriod
  };
}

// Endpoint untuk preview prorata
router.post('/calculate-prorata', async (req, res) => {
  try {
    const { activeDate, packagePrice, activePeriod, activePeriodUnit } = req.body;
    
    const proRataData = calculateProRata(activeDate, packagePrice, activePeriod, activePeriodUnit);
    
    res.json({
      success: true,
      data: proRataData
    });
  } catch (error) {
    console.error('Error calculating prorata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update generate-monthly-bills untuk handle prorata
router.post('/generate-monthly-bills', async (req, res) => {
  try {
    const { Customer, Transaction, AddonItem } = require('../models');
    const { Op } = require('sequelize');
    
    // Ambil semua pelanggan aktif
    const activeCustomers = await Customer.findAll({
      where: {
        status: 'active',
        serviceStatus: 'active'
      },
      include: [{
        model: AddonItem,
        as: 'addonItems',
        where: {
          isActive: true,
          [Op.or]: [
            { itemType: 'monthly' },
            { itemType: 'one_time', isPaid: false }
          ]
        },
        required: false
      }]
    });
    
    const bills = [];
    
    for (const customer of activeCustomers) {
      // Cek apakah sudah ada tagihan bulan ini
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const existingBill = await Transaction.findOne({
        where: {
          customerId: customer.id,
          type: 'bill',
          createdAt: {
            [Op.gte]: thisMonth
          }
        }
      });
      
      if (existingBill) continue;
      
      // Hitung total tagihan
      let totalAmount = parseFloat(customer.packagePrice);
      let breakdown = {
        package: {
          name: customer.package,
          price: parseFloat(customer.packagePrice)
        },
        addons: [],
        oneTimeItems: [],
        discount: parseFloat(customer.discount) || 0
      };
      
      // Handle prorata untuk bulan pertama
      if (!customer.isProRataApplied && customer.activeDate) {
        const proRataData = calculateProRata(
          customer.activeDate,
          customer.packagePrice,
          customer.activePeriod,
          customer.activePeriodUnit
        );
        
        if (proRataData.isProRataApplied) {
          totalAmount = proRataData.proRataAmount;
          breakdown.package.price = proRataData.proRataAmount;
          breakdown.package.note = `Prorata ${proRataData.remainingDays}/${proRataData.daysInMonth} hari`;
          
          // Update customer prorata status
          await customer.update({
            isProRataApplied: true,
            proRataAmount: proRataData.proRataAmount
          });
        }
      }
      
      // Tambahkan addon items
      if (customer.addonItems) {
        for (const addon of customer.addonItems) {
          const addonTotal = parseFloat(addon.price) * addon.quantity;
          
          if (addon.itemType === 'monthly') {
            totalAmount += addonTotal;
            breakdown.addons.push({
              name: addon.itemName,
              price: parseFloat(addon.price),
              quantity: addon.quantity,
              total: addonTotal
            });
          } else if (addon.itemType === 'one_time' && !addon.isPaid) {
            totalAmount += addonTotal;
            breakdown.oneTimeItems.push({
              name: addon.itemName,
              price: parseFloat(addon.price),
              quantity: addon.quantity,
              total: addonTotal
            });
            
            // Mark one-time item as billed
            await addon.update({ isPaid: true });
          }
        }
      }
      
      // Kurangi diskon
      totalAmount -= parseFloat(customer.discount) || 0;
      
      // Buat transaksi tagihan
      const bill = await Transaction.create({
        customerId: customer.id,
        type: 'bill',
        amount: Math.max(0, totalAmount),
        description: `Tagihan bulanan ${getJakartaTime().format('MMMM YYYY')}`,
        status: 'pending',
        dueDate: getJakartaTime().date(5).toDate(),
        breakdown: breakdown
      });
      
      // Update customer billing info
      await customer.update({
        lastBillingDate: getJakartaTime().toDate(),
        nextBillingDate: getJakartaTime().add(1, 'month').date(1).toDate(),
        billingStatus: 'belum_lunas'
      });
      
      bills.push(bill);
    }
    
    res.json({
      success: true,
      message: `${bills.length} tagihan berhasil dibuat`,
      data: bills
    });
  } catch (error) {
    console.error('Error generating monthly bills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API untuk mengelola add-on items
router.get('/customers/:customerId/addons', async (req, res) => {
  try {
    const addons = await AddonItem.findAll({
      where: { 
        customerId: req.params.customerId,
        isActive: true
      }
    });
    res.json({ success: true, data: addons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/customers/:customerId/addons', async (req, res) => {
  try {
    const { itemName, itemType, price, quantity, description } = req.body;
    
    const addon = await AddonItem.create({
      customerId: req.params.customerId,
      itemName,
      itemType,
      price,
      quantity: quantity || 1,
      description
    });
    
    res.json({ success: true, data: addon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/addons/:id', async (req, res) => {
  try {
    const addon = await AddonItem.findByPk(req.params.id);
    if (!addon) {
      return res.status(404).json({ error: 'Add-on item not found' });
    }
    
    await addon.update(req.body);
    res.json({ success: true, data: addon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/addons/:id', async (req, res) => {
  try {
    const addon = await AddonItem.findByPk(req.params.id);
    if (!addon) {
      return res.status(404).json({ error: 'Add-on item not found' });
    }
    
    await addon.update({ isActive: false });
    res.json({ success: true, message: 'Add-on item deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspend overdue customers
router.post('/suspend-overdue', async (req, res) => {
  try {
    const currentDate = getJakartaTime();
    const suspendDate = currentDate.clone().date(6).startOf('day');
    
    if (currentDate.isSame(suspendDate, 'day')) {
      // Get customers with overdue bills
      const overdueCustomers = await Customer.findAll({
        where: {
          billingStatus: 'belum_lunas',
          serviceStatus: 'active'
        },
        include: [{
          model: Transaction,
          where: {
            status: 'pending',
            dueDate: {
              [Op.lt]: currentDate.toDate()
            }
          }
        }]
      });
      
      const suspended = [];
      
      for (const customer of overdueCustomers) {
        await customer.update({
          billingStatus: 'suspend',
          mikrotikStatus: 'disabled',
          lastSuspendDate: currentDate.toDate()
        });
        
        // Ganti TODO dengan implementasi aktual
const mikrotikAPI = require('../utils/mikrotik');
await mikrotikAPI.disablePPPSecret(customer.router, customer.pppSecret);
        
        suspended.push(customer);
      }
      
      res.json({ 
        success: true, 
        message: `Suspended ${suspended.length} customers`,
        suspended 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Not suspension day' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;