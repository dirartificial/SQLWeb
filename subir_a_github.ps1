# Script para subir el proyecto a GitHub
# Autor: Antigravity AI
# Ejecutar en PowerShell dentro de la raíz del proyecto.

Write-Host "=== CONFIGURACION Y SUBIDA A GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si git está inicializado
if (!(Test-Path .git)) {
    Write-Host "Inicializando repositorio Git local..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "El repositorio Git ya esta inicializado localmente." -ForegroundColor Green
}

# 2. Renombrar la rama principal a main
Write-Host "Configurando la rama principal como 'main'..." -ForegroundColor Yellow
git branch -M main

# 3. Verificar o configurar el remoto 'origin'
$remoteUrl = ""
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "El remoto 'origin' ya existe: $existingRemote" -ForegroundColor Green
    $changeRemote = Read-Host "Deseas cambiar la URL del remoto? (S/N)"
    if ($changeRemote -eq "S" -or $changeRemote -eq "s" -or $changeRemote -eq "si" -or $changeRemote -eq "SI" -or $changeRemote -eq "y" -or $changeRemote -eq "Y") {
        $remoteUrl = Read-Host "Ingresa la nueva URL de GitHub (ej: https://github.com/tu-usuario/sistema_freire.git)"
        if ($remoteUrl) {
            git remote set-url origin $remoteUrl
            Write-Host "Remoto 'origin' actualizado a: $remoteUrl" -ForegroundColor Green
        }
    }
} else {
    Write-Host "Por favor, proporciona la URL del repositorio que creaste en GitHub." -ForegroundColor Cyan
    Write-Host "Suele tener la forma: https://github.com/tu-usuario/sistema_freire.git" -ForegroundColor Gray
    $remoteUrl = Read-Host "URL del repositorio de GitHub"
    while (-not $remoteUrl) {
        $remoteUrl = Read-Host "La URL es requerida. Por favor, ingresa la URL de tu repositorio"
    }
    git remote add origin $remoteUrl
    Write-Host "Remoto 'origin' agregado con exito: $remoteUrl" -ForegroundColor Green
}

# 4. Agregar archivos
Write-Host "Preparando archivos (git add .)..." -ForegroundColor Yellow
git add .

# 5. Commit inicial
$commitMsg = Read-Host "Mensaje del commit (presiona Enter para usar 'Primer commit')"
if (-not $commitMsg) {
    $commitMsg = "Primer commit"
}

Write-Host "Creando commit..." -ForegroundColor Yellow
git commit -m $commitMsg

# 6. Push a GitHub
Write-Host "Subiendo archivos a GitHub (git push -u origin main)..." -ForegroundColor Yellow
Write-Host "Nota: Si es la primera vez que te conectas a este usuario en esta PC, se abrira una ventana para autenticarte con GitHub." -ForegroundColor Magenta
git push -u origin main

# Si falla por rechazo (conflictos con archivos creados por GitHub como un .gitignore remoto)
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "El push fue rechazado. Esto suele ocurrir si creaste el repositorio en GitHub con un archivo inicial (como un .gitignore o README)." -ForegroundColor Yellow
    $forcePush = Read-Host "Deseas forzar la subida (Force Push) para sobreescribir el repositorio en GitHub con tus archivos locales? (S/N)"
    if ($forcePush -eq "S" -or $forcePush -eq "s" -or $forcePush -eq "si" -or $forcePush -eq "SI" -or $forcePush -eq "y" -or $forcePush -eq "Y") {
        Write-Host "Forzando subida (git push -u origin main --force)..." -ForegroundColor Yellow
        git push -u origin main --force
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Proyecto subido exitosamente a GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Ocurrio un error al subir a GitHub. Verifica que la URL del repositorio sea correcta y tengas permisos de acceso." -ForegroundColor Red
}

Write-Host ""
Read-Host "Presiona Enter para terminar..."
