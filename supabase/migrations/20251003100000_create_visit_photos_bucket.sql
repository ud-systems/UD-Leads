-- Create visit-photos storage bucket for visit photo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-photos',
  'visit-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for visit-photos bucket
CREATE POLICY "Users can upload visit photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'visit-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view visit photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'visit-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own visit photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'visit-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own visit photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'visit-photos' AND
  auth.role() = 'authenticated'
);
