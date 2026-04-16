
-- Fix 1: Drop the overly permissive public SELECT policy and replace with authenticated-only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Fix 3: Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the unauthenticated view policy and replace with authenticated
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Authenticated users can view avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
