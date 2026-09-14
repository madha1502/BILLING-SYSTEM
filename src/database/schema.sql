-- ====================================================================
-- KiranaPro SaaS Database DDL Schema (PostgreSQL 16+)
-- Author: Senior Database Architect
-- Purpose: Multi-tenant Kirana Store SaaS Platform
-- ====================================================================

-- 1. Create Enums
CREATE TYPE role_type AS ENUM ('OWNER', 'MANAGER', 'CASHIER', 'STAFF');
CREATE TYPE tenant_status AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE unit_type AS ENUM ('PIECE', 'KG', 'GRAM', 'LITRE', 'ML', 'PACKET', 'BOX', 'BOTTLE', 'DOZEN', 'METRE');
CREATE TYPE sale_status AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'CARD', 'SPLIT', 'OTHER');
CREATE TYPE inventory_tx_type AS ENUM ('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE');
CREATE TYPE expense_category AS ENUM ('RENT', 'ELECTRICITY', 'SALARY', 'TRANSPORT', 'PURCHASE_RELATED', 'MAINTENANCE', 'OTHER');
CREATE TYPE sms_status AS ENUM ('PENDING', 'SENT', 'FAILED');
CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- 2. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    local_name VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    gstin VARCHAR(15),
    is_gst_registered BOOLEAN DEFAULT FALSE,
    currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    status tenant_status DEFAULT 'TRIAL',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_counter INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role role_type DEFAULT 'CASHIER',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    local_name VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_category UNIQUE (tenant_id, name)
);

-- 5. Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    local_name VARCHAR(255),
    barcode VARCHAR(100),
    sku VARCHAR(100),
    unit unit_type DEFAULT 'PIECE',
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    tax_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (tax_rate >= 0),
    current_stock NUMERIC(12, 3) DEFAULT 0.000,
    minimum_stock NUMERIC(12, 3) DEFAULT 5.000,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_products_tenant_name ON products(tenant_id, name);
CREATE INDEX idx_products_tenant_barcode ON products(tenant_id, barcode);

-- 6. Product Barcodes Table
CREATE TABLE product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_barcode UNIQUE (tenant_id, barcode)
);

-- 7. Product Aliases Table (For Voice Recognition & Multilingual Search)
CREATE TABLE product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL, -- e.g. "arisi", "ponni", "அரிசி"
    local_alias VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_alias UNIQUE (tenant_id, alias)
);

-- 8. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    total_purchases NUMERIC(12, 2) DEFAULT 0.00,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_customers_tenant_phone ON customers(tenant_id, phone);

-- 9. Sales Table (Invoices / Bills)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status sale_status DEFAULT 'COMPLETED',
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method payment_method DEFAULT 'CASH',
    notes TEXT,
    local_created_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_bill_number UNIQUE (tenant_id, bill_number),
    CONSTRAINT unique_tenant_idempotency UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX idx_sales_tenant_created ON sales(tenant_id, created_at);

-- 10. Sale Items Table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit unit_type DEFAULT 'PIECE',
    unit_price NUMERIC(12, 2) NOT NULL,
    purchase_price_at_sale NUMERIC(12, 2) NOT NULL,
    tax_rate_at_sale NUMERIC(5, 2) DEFAULT 0.00,
    quantity NUMERIC(12, 3) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

-- 11. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Inventory Transactions Table (Stock Ledger)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type inventory_tx_type NOT NULL,
    quantity_change NUMERIC(12, 3) NOT NULL,
    stock_after NUMERIC(12, 3) NOT NULL,
    reference_id VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    payment_method payment_method DEFAULT 'CASH',
    description TEXT,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
