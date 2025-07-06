-- Create table for uploaded field files
CREATE TABLE public.uploaded_field_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

-- Create table for extracted field names from uploaded files
CREATE TABLE public.field_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.uploaded_field_files(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id, field_name)
);

-- Enable RLS
ALTER TABLE public.uploaded_field_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_names ENABLE ROW LEVEL SECURITY;

-- RLS policies for uploaded_field_files
CREATE POLICY "Users can view their own uploaded files"
ON public.uploaded_field_files
FOR SELECT
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert their own uploaded files"
ON public.uploaded_field_files
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own uploaded files"
ON public.uploaded_field_files
FOR UPDATE
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own uploaded files"
ON public.uploaded_field_files
FOR DELETE
USING (auth.uid() = uploaded_by);

-- RLS policies for field_names
CREATE POLICY "Users can view field names from their files"
ON public.field_names
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.uploaded_field_files 
  WHERE id = field_names.file_id AND uploaded_by = auth.uid()
));

CREATE POLICY "Users can insert field names for their files"
ON public.field_names
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.uploaded_field_files 
  WHERE id = field_names.file_id AND uploaded_by = auth.uid()
));

CREATE POLICY "Users can update field names from their files"
ON public.field_names
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.uploaded_field_files 
  WHERE id = field_names.file_id AND uploaded_by = auth.uid()
));

CREATE POLICY "Users can delete field names from their files"
ON public.field_names
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.uploaded_field_files 
  WHERE id = field_names.file_id AND uploaded_by = auth.uid()
));

-- Create function to update updated_at timestamp for uploaded_field_files
CREATE TRIGGER update_uploaded_field_files_updated_at
BEFORE UPDATE ON public.uploaded_field_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();