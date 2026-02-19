-- ============================================
-- COMPANY_ID COLUMN SETUP FOR SUPABASE
-- ============================================
-- Run this in your Supabase SQL Editor
-- Replace '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f' with your actual company ID

-- ============================================
-- STEP 0: Create company_members table for access control
-- ============================================

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_members_user_company 
ON company_members(user_id, company_id);

-- ============================================
-- STEP 1: Add company_id columns (if they don't exist)
-- ============================================

-- Add to lead_store
ALTER TABLE lead_store 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add to whatsapp_conversations
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add to Conversations
ALTER TABLE "Conversations" 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add to documents (if it exists)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- ============================================
-- STEP 2: Populate company_id for existing data
-- ============================================
-- This sets ALL existing rows to the same company_id
-- Adjust the UUID to match your company

UPDATE lead_store 
SET company_id = '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f'
WHERE company_id IS NULL;

UPDATE whatsapp_conversations 
SET company_id = '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f'
WHERE company_id IS NULL;

UPDATE "Conversations" 
SET company_id = '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f'
WHERE company_id IS NULL;

UPDATE documents 
SET company_id = '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f'
WHERE company_id IS NULL;

-- ============================================
-- STEP 3: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lead_store_company_id 
ON lead_store(company_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_company_id 
ON whatsapp_conversations(company_id);

CREATE INDEX IF NOT EXISTS idx_conversations_company_id 
ON "Conversations"(company_id);

CREATE INDEX IF NOT EXISTS idx_documents_company_id 
ON documents(company_id);

-- ============================================
-- STEP 4: Add NOT NULL constraint (optional, for future rows)
-- ============================================
-- Uncomment these if you want to enforce company_id on all new rows

-- ALTER TABLE lead_store 
-- ALTER COLUMN company_id SET NOT NULL;

-- ALTER TABLE whatsapp_conversations 
-- ALTER COLUMN company_id SET NOT NULL;

-- ALTER TABLE "Conversations" 
-- ALTER COLUMN company_id SET NOT NULL;

-- ============================================
-- STEP 5: Add users to company_members table
-- ============================================
-- IMPORTANT: Add your authorized users here
-- Replace the email addresses with your actual users

-- Example: Add a user by email to this company
-- First, get the user_id from auth.users, then insert into company_members

-- Method 1: If you know the user's email
INSERT INTO company_members (user_id, company_id, role)
SELECT 
  id as user_id,
  '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f' as company_id,
  'admin' as role
FROM auth.users
WHERE email = 'your-user@example.com'
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Method 2: Add ALL existing users to this company (use with caution!)
-- Uncomment the lines below if you want to give all existing users access
-- INSERT INTO company_members (user_id, company_id, role)
-- SELECT 
--   id as user_id,
--   '8f7a2b1c-4d3e-4a5f-9b8c-7e6d5c4b3a2f' as company_id,
--   'member' as role
-- FROM auth.users
-- ON CONFLICT (user_id, company_id) DO NOTHING;

-- ============================================
-- STEP 6: Verify the changes
-- ============================================

-- Check lead_store
SELECT 
  COUNT(*) as total_rows,
  COUNT(company_id) as rows_with_company_id,
  COUNT(DISTINCT company_id) as unique_companies
FROM lead_store;

-- Check whatsapp_conversations
SELECT 
  COUNT(*) as total_rows,
  COUNT(company_id) as rows_with_company_id,
  COUNT(DISTINCT company_id) as unique_companies
FROM whatsapp_conversations;

-- Check Conversations
SELECT 
  COUNT(*) as total_rows,
  COUNT(company_id) as rows_with_company_id,
  COUNT(DISTINCT company_id) as unique_companies
FROM "Conversations";

-- Check company_members
SELECT 
  cm.id,
  cm.company_id,
  cm.role,
  au.email,
  cm.created_at
FROM company_members cm
JOIN auth.users au ON cm.user_id = au.id
ORDER BY cm.created_at DESC;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This script assumes you want to assign ALL existing data to one company
-- 2. If you have data from multiple companies, you'll need to update them separately
-- 3. For production, consider adding Row Level Security (RLS) policies
-- 4. Make sure to backup your data before running UPDATE statements
-- 5. CRITICAL: You MUST add users to company_members table or they won't be able to log in!
--    Use the INSERT statements in STEP 5 to authorize users for this dashboard
