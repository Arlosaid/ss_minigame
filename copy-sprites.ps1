# Script PowerShell para copiar sprites de personajes de MUGEN al juego
# Uso: .\copy-sprites.ps1 -Character "NombrePersonaje"

param(
    [Parameter(Mandatory=$false)]
    [string]$Character = "Milo",
    
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "c:\Users\Alonso\Desktop\sprites",
    
    [Parameter(Mandatory=$false)]
    [string]$DestPath = "c:\Users\Alonso\Desktop\SS\public\sprites"
)

Write-Host "Copiando sprites de $Character..." -ForegroundColor Cyan

# Crear directorio si no existe
if (-not (Test-Path $DestPath)) {
    New-Item -Path $DestPath -ItemType Directory -Force | Out-Null
}

$charPath = Join-Path $SourcePath $Character

if (-not (Test-Path $charPath)) {
    Write-Host "Error: No se encontró la carpeta $charPath" -ForegroundColor Red
    exit 1
}

# Obtener todos los archivos PNG
$sprites = Get-ChildItem -Path $charPath -Filter "*.png" | Sort-Object Name

if ($sprites.Count -eq 0) {
    Write-Host "Error: No se encontraron sprites PNG en $charPath" -ForegroundColor Red
    exit 1
}

Write-Host "Encontrados $($sprites.Count) sprites" -ForegroundColor Green

# Copiar sprites principales
$mapping = @{
    # Idle / Standing
    "group_0_index_0.png" = "player_idle.png"
    "group_0_index_1.png" = "player_idle_2.png"
    
    # Walking
    "group_0_index_1.png" = "player_walk_1.png"
    "group_0_index_2.png" = "player_walk_2.png"
    "group_0_index_3.png" = "player_walk_3.png"
    
    # Attack
    "group_1010_index_3.png" = "player_attack_1.png"
    "group_1010_index_4.png" = "player_attack_2.png"
    "group_1010_index_5.png" = "player_attack_3.png"
    "group_1010_index_6.png" = "player_attack_4.png"
    
    # Special attack
    "group_1010_index_10.png" = "player_special_1.png"
    "group_1010_index_11.png" = "player_special_2.png"
    "group_1010_index_12.png" = "player_special_3.png"
}

$copied = 0
foreach ($entry in $mapping.GetEnumerator()) {
    $sourceName = $entry.Key
    $destName = $entry.Value
    
    $sourceFile = Join-Path $charPath $sourceName
    $destFile = Join-Path $DestPath $destName
    
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $destFile -Force
        Write-Host "  ✓ $sourceName -> $destName" -ForegroundColor Green
        $copied++
    } else {
        Write-Host "  ⚠ $sourceName no encontrado" -ForegroundColor Yellow
    }
}

Write-Host "`nCopiados $copied sprites exitosamente!" -ForegroundColor Cyan
Write-Host "Ubicación: $DestPath" -ForegroundColor Gray

# Mostrar lista de sprites disponibles
Write-Host "`nSprites disponibles en el directorio origen:" -ForegroundColor Cyan
Get-ChildItem -Path $charPath -Filter "group_*.png" | 
    Select-Object -First 20 Name | 
    ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

if ($sprites.Count -gt 20) {
    Write-Host "  ... y $($sprites.Count - 20) más" -ForegroundColor Gray
}
