-- Create extracted_tags table to store AI-extracted tags from templates
CREATE TABLE public.extracted_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  pattern TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  context TEXT,
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  extracted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create internal_tags table for the tag library
CREATE TABLE public.internal_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string',
  validation TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create tag_mappings table to map extracted tags to internal tags
CREATE TABLE public.tag_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  extracted_tag_id UUID REFERENCES public.extracted_tags(id) ON DELETE CASCADE NOT NULL,
  internal_tag_id UUID REFERENCES public.internal_tags(id) ON DELETE SET NULL,
  mapping_logic TEXT,
  status TEXT NOT NULL DEFAULT 'unmapped' CHECK (status IN ('unmapped', 'mapped', 'logic', 'validated', 'error')),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE public.extracted_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for extracted_tags
CREATE POLICY "Users can view extracted tags from their templates" 
ON public.extracted_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.templates 
    WHERE templates.id = extracted_tags.template_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can create extracted tags for their templates" 
ON public.extracted_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.templates 
    WHERE templates.id = extracted_tags.template_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can update extracted tags from their templates" 
ON public.extracted_tags 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.templates 
    WHERE templates.id = extracted_tags.template_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can delete extracted tags from their templates" 
ON public.extracted_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.templates 
    WHERE templates.id = extracted_tags.template_id 
    AND templates.uploaded_by = auth.uid()
  )
);

-- RLS policies for internal_tags (shared library)
CREATE POLICY "Users can view all internal tags" 
ON public.internal_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create internal tags" 
ON public.internal_tags 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own internal tags" 
ON public.internal_tags 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own internal tags" 
ON public.internal_tags 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS policies for tag_mappings
CREATE POLICY "Users can view mappings for their extracted tags" 
ON public.tag_mappings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_tags 
    JOIN public.templates ON templates.id = extracted_tags.template_id
    WHERE extracted_tags.id = tag_mappings.extracted_tag_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can create mappings for their extracted tags" 
ON public.tag_mappings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.extracted_tags 
    JOIN public.templates ON templates.id = extracted_tags.template_id
    WHERE extracted_tags.id = tag_mappings.extracted_tag_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can update mappings for their extracted tags" 
ON public.tag_mappings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_tags 
    JOIN public.templates ON templates.id = extracted_tags.template_id
    WHERE extracted_tags.id = tag_mappings.extracted_tag_id 
    AND templates.uploaded_by = auth.uid()
  )
);

CREATE POLICY "Users can delete mappings for their extracted tags" 
ON public.tag_mappings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_tags 
    JOIN public.templates ON templates.id = extracted_tags.template_id
    WHERE extracted_tags.id = tag_mappings.extracted_tag_id 
    AND templates.uploaded_by = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_extracted_tags_template_id ON public.extracted_tags(template_id);
CREATE INDEX idx_extracted_tags_confidence ON public.extracted_tags(confidence DESC);
CREATE INDEX idx_internal_tags_category ON public.internal_tags(category);
CREATE INDEX idx_internal_tags_name ON public.internal_tags(name);
CREATE INDEX idx_tag_mappings_extracted_tag_id ON public.tag_mappings(extracted_tag_id);
CREATE INDEX idx_tag_mappings_internal_tag_id ON public.tag_mappings(internal_tag_id);
CREATE INDEX idx_tag_mappings_status ON public.tag_mappings(status);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_extracted_tags_updated_at
BEFORE UPDATE ON public.extracted_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_tags_updated_at
BEFORE UPDATE ON public.internal_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tag_mappings_updated_at
BEFORE UPDATE ON public.tag_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default internal tags
INSERT INTO public.internal_tags (name, category, description, data_type) VALUES
('company_name', 'legal', 'Name of the company', 'string'),
('contract_date', 'legal', 'Date of the contract', 'date'),
('contract_value', 'financial', 'Total value of the contract', 'number'),
('payment_terms', 'financial', 'Payment terms and conditions', 'string'),
('employee_name', 'hr', 'Full name of the employee', 'string'),
('employee_id', 'hr', 'Unique employee identifier', 'string'),
('start_date', 'hr', 'Employment start date', 'date'),
('salary', 'hr', 'Employee salary', 'number'),
('department', 'business', 'Department or division', 'string'),
('project_name', 'business', 'Name of the project', 'string'),
('description', 'general', 'General description field', 'text'),
('notes', 'general', 'Additional notes or comments', 'text');