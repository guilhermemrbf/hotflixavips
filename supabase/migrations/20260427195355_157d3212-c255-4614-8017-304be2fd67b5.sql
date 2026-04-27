CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transacao_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendente',
  email TEXT,
  nome TEXT,
  valor NUMERIC,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Polling público do status pelo transacao_id (necessário para o checkout saber se foi pago)
CREATE POLICY "Público pode consultar status pelo transacao_id"
ON public.pagamentos
FOR SELECT
USING (true);

CREATE INDEX idx_pagamentos_transacao_id ON public.pagamentos(transacao_id);
CREATE INDEX idx_pagamentos_status ON public.pagamentos(status);