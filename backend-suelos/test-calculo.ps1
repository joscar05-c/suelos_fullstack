# 🚀 Script de Prueba Rápida - Cálculo de Nutrientes

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   PRUEBA DE CÁLCULO DE NUTRIENTES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si el servidor está corriendo
Write-Host "🔍 Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: El servidor no está corriendo" -ForegroundColor Red
    Write-Host "   Ejecuta: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CASO DE PRUEBA 1: Valores Básicos" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$body = @{
    areaHa = 1
    profundidadMetros = 0.15
    idTextura = 4
    materiaOrganica = 3
    fosforoPpm = 10.5
    potasioPpm = 210
    idZona = 4
} | ConvertTo-Json

Write-Host ""
Write-Host "📤 Datos de entrada:" -ForegroundColor Magenta
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/calculo-suelo/calcular-nutrientes" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 RESULTADOS:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $pcaEsperado = 5100
    $nEsperado = 61.2
    $pEsperado = 35.037
    $kEsperado = 294.984
    
    Write-Host ("  Peso Capa Arable (PCA): {0:N3} toneladas" -f $response.pcaToneladas) -ForegroundColor White
    Write-Host ("  Esperado: {0:N3} t" -f $pcaEsperado) -ForegroundColor Gray
    
    if ([Math]::Abs($response.pcaToneladas - $pcaEsperado) -lt 1) {
        Write-Host "  ✅ CORRECTO" -ForegroundColor Green
    } else {
        Write-Host "  ❌ INCORRECTO" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host ("  Nitrógeno Disponible: {0:N3} kg" -f $response.nitrogenoDisponibleKg) -ForegroundColor White
    Write-Host ("  Esperado: {0:N3} kg" -f $nEsperado) -ForegroundColor Gray
    
    if ([Math]::Abs($response.nitrogenoDisponibleKg - $nEsperado) -lt 1) {
        Write-Host "  ✅ CORRECTO" -ForegroundColor Green
    } else {
        Write-Host "  ❌ INCORRECTO (¿Falta conversión a kg?)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host ("  Fósforo Disponible: {0:N3} kg" -f $response.fosforoDisponibleKg) -ForegroundColor White
    Write-Host ("  Esperado: {0:N3} kg" -f $pEsperado) -ForegroundColor Gray
    
    if ([Math]::Abs($response.fosforoDisponibleKg - $pEsperado) -lt 1) {
        Write-Host "  ✅ CORRECTO" -ForegroundColor Green
    } else {
        Write-Host "  ❌ INCORRECTO" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host ("  Potasio Disponible: {0:N3} kg" -f $response.potasioDisponibleKg) -ForegroundColor White
    Write-Host ("  Esperado: {0:N3} kg" -f $kEsperado) -ForegroundColor Gray
    
    if ([Math]::Abs($response.potasioDisponibleKg - $kEsperado) -lt 1) {
        Write-Host "  ✅ CORRECTO" -ForegroundColor Green
    } else {
        Write-Host "  ❌ INCORRECTO" -ForegroundColor Red
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    # Cálculos detallados
    Write-Host "🔬 VERIFICACIÓN PASO A PASO:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $areaM2 = 1 * 10000
    $densidad = 1.70  # Asumiendo textura 1 = Arenoso
    $pca = $areaM2 * $densidad * 0.3
    
    Write-Host ("PASO B - PCA: {0} m² × {1} t/m³ × {2} m = {3:N2} t" -f $areaM2, $densidad, 0.3, $pca) -ForegroundColor Gray
    
    $moTotal = $pca * (4 / 100)
    Write-Host ("PASO C.1 - MO Total: {0:N2} t × 0.04 = {1:N2} t" -f $pca, $moTotal) -ForegroundColor Gray
    
    $nOrganico = $moTotal * 0.05
    Write-Host ("PASO C.2 - N Orgánico: {0:N2} t × 0.05 = {1:N2} t" -f $moTotal, $nOrganico) -ForegroundColor Gray
    
    $tasaMineralizacion = 2  # Asumiendo zona 1 = Costa = 2%
    $nMineralizado = $nOrganico * ($tasaMineralizacion / 100)
    Write-Host ("PASO C.3 - N Mineralizado: {0:N2} t × 0.02 = {1:N4} t" -f $nOrganico, $nMineralizado) -ForegroundColor Gray
    
    $nMineralizadoKg = $nMineralizado * 1000
    Write-Host ("PASO C.4 - N en Kg: {0:N4} t × 1000 = {1:N2} kg" -f $nMineralizado, $nMineralizadoKg) -ForegroundColor Yellow
    
    $factorN = 0.30  # Asumiendo factor N = 0.30
    $nDisponible = $nMineralizadoKg * $factorN
    Write-Host ("PASO C.5 - N Disponible: {0:N2} kg × {1} = {2:N2} kg" -f $nMineralizadoKg, $factorN, $nDisponible) -ForegroundColor Gray
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ERROR al hacer la petición:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. El servidor no está corriendo (npm run start:dev)" -ForegroundColor Gray
    Write-Host "  2. La base de datos no tiene datos (verifica semillas)" -ForegroundColor Gray
    Write-Host "  3. Los IDs de textura o zona no existen" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Prueba completada" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Para más pruebas, usa el archivo test-calculo.http" -ForegroundColor Yellow
Write-Host "   con la extensión REST Client de VS Code" -ForegroundColor Gray
