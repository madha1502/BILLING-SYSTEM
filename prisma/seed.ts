import { PrismaClient, Role, TenantStatus, Unit, SaleStatus, PaymentMethod, InventoryTxType, ExpenseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting KiranaPro SaaS Database Seed...');

  // 1. Create Default SaaS Plans
  const freePlan = await prisma.plan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free Trial Plan',
      priceMonthly: 0.00,
      maxUsers: 1,
      maxProducts: 100,
      maxBillsPerMonth: 250,
      includesSms: false,
      includesVoice: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { code: 'PRO' },
    update: {},
    create: {
      code: 'PRO',
      name: 'Kirana Pro SaaS Plan',
      priceMonthly: 299.00,
      maxUsers: 5,
      maxProducts: 2000,
      maxBillsPerMonth: 10000,
      includesSms: true,
      includesVoice: true,
    },
  });

  console.log('✅ SaaS Subscription Plans Created');

  // 2. Create Demo Tenant (Kirana Store)
  const passwordHash = await bcrypt.hash('Kirana123!', 10);

  const tenant = await prisma.tenant.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Vinisha Nellai Stores Kangeyam',
      localName: 'வினிஷா நெல்லை ஸ்டோர்ஸ் காங்கேயம்',
      phone: '9876543210',
      address: 'Main Road, Kangeyam, Tiruppur Dist, Tamil Nadu 638701',
      gstin: '33AAAAA0000A1Z5',
      isGstRegistered: true,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: TenantStatus.ACTIVE,
      invoicePrefix: 'VNS',
      invoiceCounter: 105,
    },
  });

  // 3. Create Users (Owner & Cashier)
  const owner = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Murugan (Owner)',
      phone: '9876543210',
      passwordHash,
      role: Role.OWNER,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Raju (Cashier)',
      phone: '9876543211',
      passwordHash,
      role: Role.CASHIER,
    },
  });

  console.log('✅ Demo Shop Owner & Cashier Created');

  // 4. Create Categories
  const catRice = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Rice & Grains',
      localName: 'அரிசி மற்றும் தானியங்கள்',
      icon: '🍚',
    },
  });

  const catOil = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Oils & Ghee',
      localName: 'எண்ணெய் மற்றும் நெய்',
      icon: '🛢',
    },
  });

  const catSoap = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Soaps & Cleaning',
      localName: 'சோப் மற்றும் சோப்புத்தூள்',
      icon: '🧼',
    },
  });

  const catBiscuits = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: 'Snacks & Biscuits',
      localName: 'பிஸ்கட் மற்றும் நொறுக்குத்தீனி',
      icon: '🍪',
    },
  });

  console.log('✅ Product Categories Created');

  // 5. Create Products with Barcodes & Multilingual Voice Aliases
  const product1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catRice.id,
      name: 'Ponni Boiled Rice (Standard)',
      localName: 'பொன்னி அரிசி',
      barcode: '890100000001',
      sku: 'RICE-PONNI-01',
      unit: Unit.KG,
      purchasePrice: 42.00,
      sellingPrice: 50.00,
      taxRate: 0.00,
      currentStock: 150.000,
      minimumStock: 20.000,
      barcodes: {
        create: [{ tenantId: tenant.id, barcode: '890100000001' }],
      },
      aliases: {
        create: [
          { tenantId: tenant.id, alias: 'rice' },
          { tenantId: tenant.id, alias: 'ponni rice' },
          { tenantId: tenant.id, alias: 'arisi' },
          { tenantId: tenant.id, alias: 'அரிசி' },
          { tenantId: tenant.id, alias: 'பொன்னி அரிசி' },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catOil.id,
      name: 'Gold Winner Refined Sunflower Oil 1L',
      localName: 'கோல்ட் வின்னர் சமையல் எண்ணெய் 1லி',
      barcode: '890123456789',
      sku: 'OIL-GW-1L',
      unit: Unit.PACKET,
      purchasePrice: 155.00,
      sellingPrice: 180.00,
      taxRate: 5.00,
      currentStock: 45.000,
      minimumStock: 10.000,
      barcodes: {
        create: [{ tenantId: tenant.id, barcode: '890123456789' }],
      },
      aliases: {
        create: [
          { tenantId: tenant.id, alias: 'oil' },
          { tenantId: tenant.id, alias: 'sunflower oil' },
          { tenantId: tenant.id, alias: 'gold winner' },
          { tenantId: tenant.id, alias: 'ennai' },
          { tenantId: tenant.id, alias: 'எண்ணெய்' },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catSoap.id,
      name: 'Hamam Bath Soap 100g',
      localName: 'ஹமாம் சோப் 100கி',
      barcode: '890103001122',
      sku: 'SOAP-HAM-100G',
      unit: Unit.PIECE,
      purchasePrice: 26.00,
      sellingPrice: 30.00,
      taxRate: 18.00,
      currentStock: 6.000, // Trigger low stock!
      minimumStock: 15.000,
      barcodes: {
        create: [{ tenantId: tenant.id, barcode: '890103001122' }],
      },
      aliases: {
        create: [
          { tenantId: tenant.id, alias: 'soap' },
          { tenantId: tenant.id, alias: 'hamam' },
          { tenantId: tenant.id, alias: 'hamam soap' },
          { tenantId: tenant.id, alias: 'சோப்' },
          { tenantId: tenant.id, alias: 'ஹமாம்' },
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catBiscuits.id,
      name: 'Parle-G Gold Biscuits 100g',
      localName: 'பார்லே-ஜி பிஸ்கட்',
      barcode: '890105800010',
      sku: 'DISC-PARLE-100G',
      unit: Unit.PACKET,
      purchasePrice: 8.50,
      sellingPrice: 10.00,
      taxRate: 18.00,
      currentStock: 80.000,
      minimumStock: 25.000,
      barcodes: {
        create: [{ tenantId: tenant.id, barcode: '890105800010' }],
      },
      aliases: {
        create: [
          { tenantId: tenant.id, alias: 'biscuit' },
          { tenantId: tenant.id, alias: 'parle g' },
          { tenantId: tenant.id, alias: 'parle' },
          { tenantId: tenant.id, alias: 'பிஸ்கட்' },
        ],
      },
    },
  });

  console.log('✅ Demo Products with Barcodes & Voice Aliases Created');

  // 6. Create Initial Stock Ledger Entries
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        productId: product1.id,
        type: InventoryTxType.PURCHASE,
        quantityChange: 150.000,
        stockAfter: 150.000,
        notes: 'Initial Stock Batch #1',
        userId: owner.id,
      },
      {
        tenantId: tenant.id,
        productId: product2.id,
        type: InventoryTxType.PURCHASE,
        quantityChange: 45.000,
        stockAfter: 45.000,
        notes: 'Initial Stock Batch #1',
        userId: owner.id,
      },
      {
        tenantId: tenant.id,
        productId: product3.id,
        type: InventoryTxType.PURCHASE,
        quantityChange: 6.000,
        stockAfter: 6.000,
        notes: 'Low stock condition for demonstration',
        userId: owner.id,
      },
    ],
  });

  // 7. Create Demo Customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Karthik Raja',
      phone: '9443322110',
      totalPurchases: 370.00,
      lastPurchaseAt: new Date(),
    },
  });

  // 8. Create Sample Completed Sale & Items
  const sampleSale = await prisma.sale.create({
    data: {
      tenantId: tenant.id,
      billNumber: 'MKS-2026-000101',
      idempotencyKey: 'SEED-SYNC-KEY-001',
      customerId: customer.id,
      userId: owner.id,
      status: SaleStatus.COMPLETED,
      subtotal: 370.00,
      discount: 0.00,
      taxAmount: 18.00,
      totalAmount: 370.00,
      paymentMethod: PaymentMethod.UPI,
      items: {
        create: [
          {
            tenantId: tenant.id,
            productId: product1.id,
            productName: product1.name,
            unit: Unit.KG,
            unitPrice: 50.00,
            purchasePriceAtSale: 42.00,
            taxRateAtSale: 0.00,
            quantity: 2.000,
            subtotal: 100.00,
            taxAmount: 0.00,
            total: 100.00,
          },
          {
            tenantId: tenant.id,
            productId: product2.id,
            productName: product2.name,
            unit: Unit.PACKET,
            unitPrice: 180.00,
            purchasePriceAtSale: 155.00,
            taxRateAtSale: 5.00,
            quantity: 1.000,
            subtotal: 180.00,
            taxAmount: 9.00,
            total: 180.00,
          },
          {
            tenantId: tenant.id,
            productId: product3.id,
            productName: product3.name,
            unit: Unit.PIECE,
            unitPrice: 30.00,
            purchasePriceAtSale: 26.00,
            taxRateAtSale: 18.00,
            quantity: 3.000,
            subtotal: 90.00,
            taxAmount: 9.00,
            total: 90.00,
          },
        ],
      },
      payments: {
        create: [
          {
            tenantId: tenant.id,
            paymentMethod: PaymentMethod.UPI,
            amount: 370.00,
            referenceNumber: 'UPI/987654123/OKAXIS',
          },
        ],
      },
      smsLogs: {
        create: [
          {
            tenantId: tenant.id,
            customerPhone: '9443322110',
            message: 'Thank you for shopping at Murugan Kirana! Bill MKS-2026-000101 Total: ₹370.',
            status: SmsStatus.SENT,
          },
        ],
      },
    },
  });

  // 9. Create Sample Expense Entry
  await prisma.expense.create({
    data: {
      tenantId: tenant.id,
      category: ExpenseCategory.ELECTRICITY,
      amount: 1450.00,
      paymentMethod: PaymentMethod.UPI,
      description: 'TNEB Electricity Bill August 2026',
      userId: owner.id,
    },
  });

  console.log('🎉 KiranaPro SaaS Seeding Completed Successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
