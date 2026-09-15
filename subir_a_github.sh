#!/bin/bash
# Script para subir el proyecto a GitHub
# Autor: Antigravity AI
# Ejecutar en la raíz del proyecto: bash subir_a_github.sh

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # Sin color

echo -e "${CYAN}=== CONFIGURACION Y SUBIDA A GITHUB ===${NC}"
echo ""

# 1. Verificar si git está inicializado
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Inicializando repositorio Git local...${NC}"
    git init
else
    echo -e "${GREEN}El repositorio Git ya esta inicializado localmente.${NC}"
fi

# 2. Renombrar la rama principal a main
echo -e "${YELLOW}Configurando la rama principal como 'main'...${NC}"
git branch -M main 2>/dev/null || true

# 3. Verificar o configurar el remoto 'origin'
REMOTE_URL=""
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)

if [ -n "$EXISTING_REMOTE" ]; then
    echo -e "${GREEN}El remoto 'origin' ya existe: $EXISTING_REMOTE${NC}"
    read -p "Deseas cambiar la URL del remoto? (s/N): " CHANGE_REMOTE
    if [[ "$CHANGE_REMOTE" =~ ^[ssSyY]$ ]]; then
        read -p "Ingresa la nueva URL de GitHub (ej: https://github.com/tu-usuario/mi-proyecto.git): " REMOTE_URL
        if [ -n "$REMOTE_URL" ]; then
            git remote set-url origin "$REMOTE_URL"
            echo -e "${GREEN}Remoto 'origin' actualizado a: $REMOTE_URL${NC}"
        fi
    fi
else
    echo -e "${CYAN}Por favor, proporciona la URL del repositorio que creaste en GitHub.${NC}"
    echo -e "${GRAY}Suele tener la forma: https://github.com/tu-usuario/mi-proyecto.git${NC}"
    read -p "URL del repositorio de GitHub: " REMOTE_URL
    while [ -z "$REMOTE_URL" ]; do
        read -p "La URL es requerida. Por favor, ingresala: " REMOTE_URL
    done
    git remote add origin "$REMOTE_URL"
    echo -e "${GREEN}Remoto 'origin' agregado con exito: $REMOTE_URL${NC}"
fi

# 4. Agregar archivos
echo -e "${YELLOW}Preparando archivos (git add .)...${NC}"
git add .

# 5. Commit inicial
read -p "Mensaje del commit (Enter para usar 'Primer commit'): " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Primer commit"
fi

echo -e "${YELLOW}Creando commit...${NC}"
git commit -m "$COMMIT_MSG"

# 6. Push a GitHub
echo -e "${YELLOW}Subiendo archivos a GitHub (git push -u origin main)...${NC}"
echo -e "${MAGENTA}Nota: Si es la primera vez que te conectas, puede pedirte autenticación.${NC}"
echo -e "${MAGENTA}Tip: GitHub ya no acepta contraseña; usa un Personal Access Token (PAT) como clave.${NC}"
git push -u origin main
PUSH_EXIT=$?

# Si falla el push (ej: conflictos con archivos remotos)
if [ $PUSH_EXIT -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}El push fue rechazado. Esto suele ocurrir si creaste el repositorio en GitHub con un archivo inicial (como un .gitignore o README).${NC}"
    read -p "Deseas forzar la subida (Force Push) y sobreescribir el repositorio remoto? (s/N): " FORCE_PUSH
    if [[ "$FORCE_PUSH" =~ ^[ssSyY]$ ]]; then
        echo -e "${YELLOW}Forzando subida (git push -u origin main --force)...${NC}"
        git push -u origin main --force
        PUSH_EXIT=$?
    fi
fi

echo ""
if [ $PUSH_EXIT -eq 0 ]; then
    echo -e "${GREEN}[OK] Proyecto subido exitosamente a GitHub!${NC}"
else
    echo -e "${RED}[ERROR] Ocurrio un error al subir a GitHub. Verifica que la URL sea correcta y tengas permisos de acceso.${NC}"
fi

echo ""
read -p "Presiona Enter para terminar..."
