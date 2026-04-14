# Supabase Migrations & Storage Setup

This directory contains SQL migrations for GDesk. These migrations must be applied manually to your Supabase project.

## Running Migrations

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your GDesk project
3. Navigate to the **SQL Editor** section
4. Create a new query for each migration file:
   - Copy contents of `001_user_profiles.sql` and execute
   - Copy contents of `002_attachments.sql` and execute

**Note:** Migrations cannot be run automatically because `.env.local` contains placeholder credentials. They must be executed manually in the Supabase dashboard after the project is created.

## Storage Buckets Setup

You must manually create two private storage buckets in your Supabase project:

### Step 1: Create Buckets
1. Go to Supabase Dashboard → **Storage**
2. Create bucket `ticket-attachments` (Private)
3. Create bucket `comment-images` (Private)

### Step 2: Configure RLS Policies
In the Supabase SQL Editor, execute:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('ticket-attachments', 'comment-images'));

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('ticket-attachments', 'comment-images'));
```

## Migration Contents

- **001_user_profiles.sql**: Creates user profiles table with RLS policies and auto-creates profiles on user signup
- **002_attachments.sql**: Creates attachments table with RLS policies for ticket/comment file uploads

All tables have Row Level Security (RLS) enabled with appropriate policies for clients, agents, and admins.
