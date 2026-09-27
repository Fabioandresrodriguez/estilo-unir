#!/usr/bin/env bash
# ==============================================================================
# Script: export_commits_zip.sh
# Descripción: Genera un archivo ZIP del código fuente para cada commit en el
#              repositorio Git, guardándolos en la carpeta 'commits/'.
#              Omite automáticamente archivos innecesarios e ignorados (.env,
#              node_modules, .next, etc.) utilizando 'git archive' y una limpieza
#              adicional de seguridad.
# ==============================================================================

set -euo pipefail

# Colores para salida de terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1. Validar que estamos dentro de un repositorio Git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo -e "${RED}Error: Este script debe ejecutarse dentro de un repositorio Git.${NC}" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
OUTPUT_DIR="${1:-${REPO_ROOT}/commits}"
REF="${2:-HEAD}"

# 2. Crear carpeta de salida
mkdir -p "$OUTPUT_DIR"

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   Exportador de Commits a ZIP - Repositorio Git     ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "Directorio de destino: ${BLUE}${OUTPUT_DIR}${NC}"
echo -e "Referencia / Rama:     ${BLUE}${REF}${NC}"

# 3. Obtener lista de commits en orden cronológico (desde el commit inicial hasta HEAD)
COMMITS=($(git rev-list --reverse "$REF"))
TOTAL_COMMITS=${#COMMITS[@]}

if [ "$TOTAL_COMMITS" -eq 0 ]; then
  echo -e "${YELLOW}No se encontraron commits para la referencia '${REF}'.${NC}"
  exit 0
fi

echo -e "Commits encontrados:   ${GREEN}${TOTAL_COMMITS}${NC}"
echo -e "Iniciando generación de archivos zip..."
echo ""

# Determinar relleno numérico (mínimo 3 dígitos para ordenar 001, 002, etc.)
PAD_WIDTH=${#TOTAL_COMMITS}
if [ "$PAD_WIDTH" -lt 3 ]; then
  PAD_WIDTH=3
fi

START_TIME=$(date +%s)
COUNT=0

for ((i=0; i<TOTAL_COMMITS; i++)); do
  COMMIT="${COMMITS[$i]}"
  INDEX=$((i + 1))
  COUNT=$((COUNT + 1))

  # Metadatos del commit
  SHORT_HASH="$(git rev-parse --short "$COMMIT")"
  INDEX_FORMATTED="$(printf "%0*d" "$PAD_WIDTH" "$INDEX")"
  RAW_SUBJECT="$(git show -s --format=%s "$COMMIT")"

  # Sanitizar el mensaje para el nombre de archivo (solo caracteres alfanuméricos y guiones)
  SAFE_SUBJECT="$(echo "$RAW_SUBJECT" | sed 's/[^a-zA-Z0-9._-]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//' | cut -c 1-50)"
  if [ -z "$SAFE_SUBJECT" ]; then
    SAFE_SUBJECT="commit"
  fi

  ZIP_NAME="${INDEX_FORMATTED}_${SHORT_HASH}_${SAFE_SUBJECT}.zip"
  ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

  # git archive extrae el árbol del commit.
  # Por diseño de Git, git archive SOLAMENTE incluye archivos versionados (trackeados).
  # Los archivos ignorados (.env, node_modules, .next, etc.) quedan omitidos por defecto.
  git archive --format=zip -o "$ZIP_PATH" "$COMMIT"

  # Capa de seguridad adicional: Si algún commit anterior hubiera incluido accidentalmente
  # archivos de entorno o dependencias, se eliminan del zip generado usando 'zip -d'.
  if command -v zip >/dev/null 2>&1; then
    zip -d "$ZIP_PATH" \
      ".env*" \
      "*.env" \
      "*.env.*" \
      "node_modules/*" \
      ".next/*" \
      ".agents/mcp_config.json" \
      ".DS_Store" \
      "*.pem" \
      >/dev/null 2>&1 || true
  fi

  # Progreso
  PERCENT=$(( INDEX * 100 / TOTAL_COMMITS ))
  printf "${BLUE}[%*d/%d]${NC} (${GREEN}%3d%%${NC}) ${CYAN}%s${NC} -> %s\n" \
    "$PAD_WIDTH" "$INDEX" "$TOTAL_COMMITS" "$PERCENT" "$SHORT_HASH" "$ZIP_NAME"
done

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

TOTAL_SIZE="$(du -sh "$OUTPUT_DIR" | cut -f1)"

echo ""
echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}✔ Proceso completado exitosamente en ${ELAPSED}s${NC}"
echo -e "📦 Total de archivos generados: ${GREEN}${COUNT}${NC}"
echo -e "📁 Ubicación:                   ${BLUE}${OUTPUT_DIR}${NC}"
echo -e "💾 Espacio ocupado:             ${BLUE}${TOTAL_SIZE}${NC}"
echo -e "${GREEN}======================================================${NC}"
