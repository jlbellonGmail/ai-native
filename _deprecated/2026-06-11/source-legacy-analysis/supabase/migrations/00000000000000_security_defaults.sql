-- Función para auto-activar RLS
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS EVENT_TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cmd record;
BEGIN
    FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
    END LOOP;
END;
$$;

-- Disparador de evento
CREATE EVENT TRIGGER ensure_rls_on_create
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION public.rls_auto_enable();