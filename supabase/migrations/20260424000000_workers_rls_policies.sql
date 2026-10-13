-- Habilitar RLS explícitamente por si acaso
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- 🧹 Primero, borramos las políticas anteriores que te di (las que exigían estar logueado)
DROP POLICY IF EXISTS "Permitir leer a usuarios autenticados" ON public.workers;
DROP POLICY IF EXISTS "Permitir insertar a usuarios autenticados" ON public.workers;
DROP POLICY IF EXISTS "Permitir actualizar a usuarios autenticados" ON public.workers;
DROP POLICY IF EXISTS "Permitir borrar a usuarios autenticados" ON public.workers;

-- 🚀 Ahora creamos políticas "públicas" para que puedas probar sin estar logueado
CREATE POLICY "Permitir lectura publica" 
ON public.workers FOR SELECT 
USING (true);

CREATE POLICY "Permitir insert publico" 
ON public.workers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir update publico" 
ON public.workers FOR UPDATE 
USING (true);

CREATE POLICY "Permitir delete publico" 
ON public.workers FOR DELETE 
USING (true);
