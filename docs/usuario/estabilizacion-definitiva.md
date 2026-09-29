# Actualizar consumidores a v2.0.5

Para actualizar un consumidor ya adoptado, ejecutá el upgrade oficial desde una
copia del Template que incluya v2.0.5:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\upgrade-template-consumer.ps1 `
  -ConsumerPath C:\ruta\al\consumidor `
  -TemplateSource https://github.com/jlbellonGmail/template.git `
  -BaselineVersion v2.0.4 `
  -TargetVersion v2.0.5 `
  -Mode Apply
```

El consumidor debe estar limpio en Git. Si el script informa `DRIFT`, primero
revisá y resolvé la diferencia del archivo compartido; el upgrade no sobrescribe
personalizaciones no reconocidas.
