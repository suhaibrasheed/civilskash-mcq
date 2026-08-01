-- ========================================================
-- MCQKASH DYNAMIC COUPON SYSTEM - SUPABASE SCHEMA & SEED DATA
-- Run this script in your Supabase SQL Editor
-- ========================================================

-- 1. Create coupons table
create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null,
  valid_days integer default 15,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security (RLS) & Public Read Policy
alter table public.coupons enable row level security;

drop policy if exists "Allow public read access to active coupons" on public.coupons;
create policy "Allow public read access to active coupons" 
  on public.coupons for select 
  using (is_active = true);

-- 3. Seed Unpredictable & Unique Coupon Codes
insert into public.coupons (code, discount_percent, valid_days, description, is_active)
values 
  -- Tier 1: In-App Static Default
  ('KASH35',        35, 9999, 'In-App Default Welcome Coupon (35% OFF)', true),
  
  -- Tier 2: Unpredictable Telegram Exclusive Codes (15-Day Expiry)
  ('TG-BOOST50',    50, 15, 'Telegram Exclusive Study Boost Offer (50% OFF)', true),
  ('MCQ-VIP70',     70, 15, 'Telegram VIP Student Special Offer (70% OFF)', true),
  ('KASH-JACKPOT80', 80, 15, 'Telegram Secret Jackpot Discount (80% OFF)', true),
  ('TG-LEGEND90',   90, 15, 'Telegram Flash Bumper Discount (90% OFF)', true)

on conflict (code) do update set
  discount_percent = excluded.discount_percent,
  valid_days = excluded.valid_days,
  description = excluded.description,
  is_active = excluded.is_active;
