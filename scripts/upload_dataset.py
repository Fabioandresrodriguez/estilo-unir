#!/usr/bin/env python3
"""
scripts/upload_dataset.py
=========================
Script interactivo y automatizado para subir el lote de imágenes desde
`./public/uploads/dataset/` al catálogo de Estilo, simulando con fidelidad
el flujo de experiencia de usuario (UX) de la plataforma:

Flujo simulado:
1. Compresión en cliente: Redimensionamiento adaptativo (max 1024px, JPEG 80%).
2. Análisis Visual e Inteligencia Artificial: Inferencia multimodal con Gemini vía
   POST /api/prendas/analyze-image para extraer y autocompletar metadatos.
3. Normalización y validación: Limpieza y mapeo con la taxonomía y reglas Zod de la app.
4. Procesamiento y Almacenamiento: Remoción de fondo y subida a AWS S3 vía POST /api/upload.
5. Persistencia en catálogo: Registro de la prenda vía POST /api/prendas o MongoDB directo.
6. Gestión de progreso: Almacena el estado en un archivo JSON para reanudar sin duplicar.
"""

import os
import sys
import io
import time
import json
import base64
import argparse
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

# Cargar variables de entorno si python-dotenv está disponible
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / '.env')
except ImportError:
    pass

try:
    import requests
except ImportError:
    print("❌ Falta la librería 'requests'. Instálala con: pip install requests")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("❌ Falta la librería 'pillow'. Instálala con: pip install pillow")
    sys.exit(1)

# Pymongo opcional para fallback directo a BD
try:
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False


# ==============================================================================
# TAXONOMÍA Y ENUMS OFICIALES DE LA PLATAFORMA (lib/validations/prenda.ts)
# ==============================================================================
CATEGORIAS_VALIDAS = ['Superior', 'Inferior', 'Entero', 'Calzado', 'Accesorios']
ESTADOS_VALIDOS = ['Disponible', 'Sucio', 'Lavandería']
COLORES_VALIDOS = [
    'Negro', 'Blanco', 'Gris', 'Azul Marino', 'Azul Claro',
    'Beige', 'Café', 'Verde Oliva', 'Burdeos', 'Rojo',
    'Amarillo', 'Verde', 'Rosa'
]
ESTACIONES_VALIDAS = ['Primavera', 'Verano', 'Otoño', 'Invierno', 'Todo el año']
ESTILOS_VALIDOS = ['Casual', 'Formal', 'Deportivo', 'Streetwear', 'Oficina', 'Fiesta']
IMPERMEABILIDAD_VALIDA = ['Sin Proteccion', 'Repelente', 'Impermeable']
CAPA_POSICION_VALIDA = ['Interior', 'Media', 'Exterior', 'Única']
ROL_CAPSULA_VALIDO = ['Esencial Neutro', 'Pieza de Acento', 'Declaración']
OCASIONES_VALIDAS = ['Trabajo', 'Deporte', 'Social', 'Formal', 'Hogar', 'Playa']

RELACION_CATEGORIA_SUBCATEGORIA: Dict[str, List[str]] = {
    'Superior': ['Camiseta', 'Camisa', 'Hoodie', 'Chamarra', 'Suéter', 'Top'],
    'Inferior': ['Jeans', 'Pantalón', 'Shorts', 'Cargo', 'Joggers', 'Falda'],
    'Entero': ['Vestido', 'Mono', 'Overol'],
    'Calzado': ['Sneakers', 'Botas', 'Zapatos Formales', 'Sandalias'],
    'Accesorios': ['Gorra', 'Bufanda', 'Cinturón', 'Lentes', 'Mochila', 'Bolso']
}


# ==============================================================================
# UTILIDADES DE NORMALIZACIÓN (RÉPLICA DE FRONTEND/BACKEND)
# ==============================================================================
def strip_accents(s: str) -> str:
    """Remueve tildes y diacríticos para comparaciones tolerantes."""
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def normalizar_color(color_input: str) -> Optional[str]:
    """Mapea sinónimos comunes y variaciones a los 13 colores oficiales."""
    if not color_input or not isinstance(color_input, str):
        return None
    clean = color_input.strip().lower()
    clean_no_acc = strip_accents(clean)

    if clean_no_acc in ['negro', 'black']: return 'Negro'
    if clean_no_acc in ['blanco', 'white'] or 'blanco' in clean_no_acc: return 'Blanco'
    if clean_no_acc in ['gris', 'grey', 'gray'] or any(k in clean_no_acc for k in ['gris', 'plata', 'plateado']): return 'Gris'
    if clean_no_acc in ['azul marino', 'navy', 'azul oscuro', 'marino', 'azul petroleo', 'azul rey']: return 'Azul Marino'
    if clean_no_acc in ['azul claro', 'celeste', 'azul cielo', 'cyan', 'azul pastel', 'turquesa']: return 'Azul Claro'
    if clean_no_acc in ['azul', 'blue']: return 'Azul Marino'
    if clean_no_acc in ['beige', 'crema', 'marfil', 'arena', 'hueso'] or 'beige' in clean_no_acc: return 'Beige'
    if clean_no_acc in ['cafe', 'marron', 'brown'] or any(k in clean_no_acc for k in ['chocolate', 'tierra', 'camel', 'tan']): return 'Café'
    if clean_no_acc in ['verde oliva', 'oliva', 'kaki', 'caqui'] or 'militar' in clean_no_acc: return 'Verde Oliva'
    if clean_no_acc in ['burdeos', 'vino', 'guinda', 'borgona', 'granate', 'burgundy', 'maroon']: return 'Burdeos'
    if clean_no_acc in ['rojo', 'red'] or any(k in clean_no_acc for k in ['rojo', 'carmesi', 'escarlata', 'coral']): return 'Rojo'
    if clean_no_acc in ['amarillo', 'yellow', 'mostaza'] or any(k in clean_no_acc for k in ['amarillo', 'dorado', 'gold', 'ocre']): return 'Amarillo'
    if clean_no_acc in ['verde', 'green'] or any(k in clean_no_acc for k in ['verde', 'esmeralda', 'menta', 'sage']): return 'Verde'
    if clean_no_acc in ['rosa', 'rosado', 'pink', 'fucsia', 'magenta', 'lila', 'morado', 'violeta', 'purpura']: return 'Rosa'

    for c in COLORES_VALIDOS:
        if c.lower() == clean or strip_accents(c.lower()) == clean_no_acc:
            return c
    return None


def normalizar_metadata_ia(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normaliza el JSON devuelto por la IA para asegurar cumplimiento estricto
    con el esquema Zod y las reglas de Mongoose.
    """
    metadata = dict(raw_data.get('metadata', {}))

    # 1. Categoría
    cat = metadata.get('categoria', 'Superior')
    matched_cat = next((c for c in CATEGORIAS_VALIDAS if strip_accents(c.lower()) == strip_accents(str(cat).lower())), 'Superior')
    metadata['categoria'] = matched_cat

    # 2. Subcategoría
    subcats_permitidas = RELACION_CATEGORIA_SUBCATEGORIA.get(matched_cat, [])
    raw_sub = str(metadata.get('subcategoria', '')).strip()
    matched_sub = next((s for s in subcats_permitidas if strip_accents(s.lower()) == strip_accents(raw_sub.lower())), None)
    if not matched_sub:
        matched_sub = next((s for s in subcats_permitidas if strip_accents(s.lower()) in strip_accents(raw_sub.lower()) or strip_accents(raw_sub.lower()) in strip_accents(s.lower())), None)
    metadata['subcategoria'] = matched_sub or (subcats_permitidas[0] if subcats_permitidas else 'Camiseta')

    # 3. Colores
    raw_colores = metadata.get('colores', [])
    if isinstance(raw_colores, str):
        raw_colores = [raw_colores]
    norm_colores = []
    for c in raw_colores:
        c_norm = normalizar_color(c)
        if c_norm and c_norm not in norm_colores:
            norm_colores.append(c_norm)
    metadata['colores'] = norm_colores[:3] if norm_colores else ['Negro']

    # 4. Estaciones
    raw_est = metadata.get('estaciones', [])
    if isinstance(raw_est, str):
        raw_est = [raw_est]
    norm_est = []
    for est in raw_est:
        clean = strip_accents(str(est).lower().strip())
        if 'primavera' in clean and 'Primavera' not in norm_est: norm_est.append('Primavera')
        elif 'verano' in clean and 'Verano' not in norm_est: norm_est.append('Verano')
        elif 'otono' in clean and 'Otoño' not in norm_est: norm_est.append('Otoño')
        elif 'invierno' in clean and 'Invierno' not in norm_est: norm_est.append('Invierno')
        elif any(k in clean for k in ['todo', 'ano', 'año']) and 'Todo el año' not in norm_est: norm_est.append('Todo el año')
    metadata['estaciones'] = norm_est if norm_est else ['Todo el año']

    # 5. Estilos
    raw_estilos = metadata.get('estilo', [])
    if isinstance(raw_estilos, str):
        raw_estilos = [raw_estilos]
    norm_estilos = []
    for est in raw_estilos:
        clean = strip_accents(str(est).lower().strip())
        if 'casual' in clean and 'Casual' not in norm_estilos: norm_estilos.append('Casual')
        elif ('formal' in clean or 'elegante' in clean) and 'Formal' not in norm_estilos: norm_estilos.append('Formal')
        elif 'deport' in clean and 'Deportivo' not in norm_estilos: norm_estilos.append('Deportivo')
        elif ('street' in clean or 'urbano' in clean) and 'Streetwear' not in norm_estilos: norm_estilos.append('Streetwear')
        elif ('oficina' in clean or 'trabajo' in clean) and 'Oficina' not in norm_estilos: norm_estilos.append('Oficina')
        elif ('fiesta' in clean or 'noche' in clean) and 'Fiesta' not in norm_estilos: norm_estilos.append('Fiesta')
    metadata['estilo'] = norm_estilos if norm_estilos else ['Casual']

    # 6. ClimaClo (0.0 - 2.0)
    clo = metadata.get('climaClo')
    try:
        metadata['climaClo'] = round(min(max(float(clo), 0.0), 2.0), 2) if clo is not None else None
    except (ValueError, TypeError):
        metadata['climaClo'] = None

    # 7. Impermeabilidad
    imp = strip_accents(str(metadata.get('impermeabilidad', '')).lower().strip())
    metadata['impermeabilidad'] = next((i for i in IMPERMEABILIDAD_VALIDA if strip_accents(i.lower()) == imp), None)

    # 8. CapaPosicion
    capa = strip_accents(str(metadata.get('capaPosicion', '')).lower().strip())
    metadata['capaPosicion'] = next((c for c in CAPA_POSICION_VALIDA if strip_accents(c.lower()) == capa), None)

    # 9. RolCapsula
    rol = strip_accents(str(metadata.get('rolCapsula', '')).lower().strip())
    metadata['rolCapsula'] = next((r for r in ROL_CAPSULA_VALIDO if strip_accents(r.lower()) == rol), None)

    # 10. Ocasiones
    raw_occ = metadata.get('ocasiones', [])
    if isinstance(raw_occ, str):
        raw_occ = [raw_occ]
    norm_occ = []
    for o in raw_occ:
        clean = strip_accents(str(o).lower().strip())
        matched = next((ov for ov in OCASIONES_VALIDAS if strip_accents(ov.lower()) == clean), None)
        if matched and matched not in norm_occ:
            norm_occ.append(matched)
    metadata['ocasiones'] = norm_occ

    # Nombre comercial
    nombre = str(raw_data.get('nombre', '')).strip()
    if not nombre or len(nombre) < 3:
        nombre = f"{metadata['subcategoria']} {metadata['colores'][0]}"
    if len(nombre) > 80:
        nombre = nombre[:80].strip()

    return {
        'nombre': nombre,
        'metadata': metadata
    }


# ==============================================================================
# SIMULACIÓN DE FLUJO DEL CLIENTE WEB
# ==============================================================================
def compress_image_client_simulation(image_path: Path, max_dim: int = 1024, quality: int = 80) -> Tuple[bytes, str]:
    """
    Simula exactamente compressImageClient() implementada en registrar/page.tsx:
    - Escala la imagen para que su dimensión mayor no supere 1024px.
    - Comprime a formato JPEG con calidad del 80%.
    - Genera el Data URI en Base64 requerido por la API de IA.
    """
    with Image.open(image_path) as img:
        img = img.convert('RGB')
        width, height = img.size

        if width > max_dim or height > max_dim:
            if width > height:
                new_h = int((height * max_dim) / width)
                new_w = max_dim
            else:
                new_w = int((width * max_dim) / height)
                new_h = max_dim
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        out_io = io.BytesIO()
        img.save(out_io, format='JPEG', quality=quality)
        compressed_bytes = out_io.getvalue()

    b64_str = base64.b64encode(compressed_bytes).decode('utf-8')
    data_uri = f'data:image/jpeg;base64,{b64_str}'
    return compressed_bytes, data_uri


class DatasetUploader:
    """Orquestador del flujo integral de subida con IA simulando un usuario."""

    def __init__(
        self,
        api_url: str,
        dataset_dir: Path,
        progress_file: Path,
        delay: float = 1.0,
        max_retries: int = 3,
        dry_run: bool = False,
        direct_db: bool = False,
        mongo_uri: Optional[str] = None
    ):
        self.api_url = api_url.rstrip('/')
        self.dataset_dir = dataset_dir
        self.progress_file = progress_file
        self.delay = delay
        self.max_retries = max_retries
        self.dry_run = dry_run
        self.direct_db = direct_db
        self.mongo_uri = mongo_uri or os.environ.get('MONGODB_URI')
        self.session = requests.Session()
        self.progress = self._load_progress()
        self.db_client = None

        if self.direct_db:
            if not PYMONGO_AVAILABLE:
                print("⚠️  pymongo no está instalado. Se utilizará el endpoint HTTP /api/prendas.")
                self.direct_db = False
            elif not self.mongo_uri:
                print("⚠️  Falta MONGODB_URI. Se utilizará el endpoint HTTP /api/prendas.")
                self.direct_db = False
            else:
                try:
                    self.db_client = MongoClient(self.mongo_uri)
                    # Test connection
                    self.db_client.admin.command('ping')
                    db_name = self.mongo_uri.split('/')[-1].split('?')[0] or 'closet_digital'
                    self.db = self.db_client[db_name]
                    print(f"📦 [DB] Conectado a MongoDB Atlas: Base de datos '{db_name}'")
                except Exception as e:
                    print(f"⚠️  Fallo conexión a MongoDB ({e}). Usando API HTTP.")
                    self.direct_db = False

    def _load_progress(self) -> Dict[str, Any]:
        """Carga el historial de prendas ya procesadas."""
        if self.progress_file.exists():
            try:
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  No se pudo leer archivo de progreso ({e}). Creando uno nuevo.")
        return {'uploaded': {}, 'failed': {}}

    def _save_progress(self):
        """Persiste el progreso en disco de forma atómica."""
        tmp_file = self.progress_file.with_suffix('.tmp')
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, indent=2, ensure_ascii=False)
        tmp_file.replace(self.progress_file)

    def analyze_image_with_ia(self, data_uri: str) -> Dict[str, Any]:
        """Paso 2: Inferencia de atributos mediante la IA de Estilo."""
        url = f"{self.api_url}/api/prendas/analyze-image"
        payload = {'image': data_uri}
        
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.post(url, json=payload, timeout=45)
                if resp.status_code == 200:
                    raw_data = resp.json()
                    return normalizar_metadata_ia(raw_data)
                elif resp.status_code == 429:
                    wait_time = 5 * attempt
                    print(f"   ⏳ [IA Rate Limit 429] Esperando {wait_time}s antes de reintentar...")
                    time.sleep(wait_time)
                else:
                    print(f"   ⚠️  [IA Status {resp.status_code}] Intento {attempt}/{self.max_retries}: {resp.text[:120]}")
            except Exception as e:
                print(f"   ⚠️  [IA Excepción] Intento {attempt}/{self.max_retries}: {e}")
            
            time.sleep(2 * attempt)

        raise RuntimeError(f"Fallo persistente en analyze-image tras {self.max_retries} intentos.")

    def upload_image_to_storage(self, filename: str, compressed_bytes: bytes, categoria: str) -> str:
        """Paso 3: Sube la imagen a la API para remoción de fondo y almacenamiento en AWS S3."""
        if self.dry_run:
            return f"https://mock-s3.amazonaws.com/estilos/{categoria.lower()}/{filename}"

        url = f"{self.api_url}/api/upload"
        files = {'files': (filename, compressed_bytes, 'image/jpeg')}
        data = {'categoria': categoria}

        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.post(url, data=data, files=files, timeout=60)
                if resp.status_code == 200:
                    urls = resp.json().get('urls', [])
                    if urls:
                        return urls[0]
                    raise ValueError("La API /api/upload no devolvió ninguna URL.")
                else:
                    print(f"   ⚠️  [Upload Status {resp.status_code}] Intento {attempt}/{self.max_retries}: {resp.text[:120]}")
            except Exception as e:
                print(f"   ⚠️  [Upload Excepción] Intento {attempt}/{self.max_retries}: {e}")

            time.sleep(2 * attempt)

        raise RuntimeError(f"Fallo persistente en /api/upload tras {self.max_retries} intentos.")

    def register_prenda(self, payload: Dict[str, Any]) -> str:
        """Paso 4: Guarda la prenda validada en el catálogo."""
        if self.dry_run:
            return "mock_prenda_id_dry_run"

        # Vía 1: Inserción directa en MongoDB (si está activada)
        if self.direct_db and self.db is not None:
            doc = {
                **payload,
                'createdAt': datetime.now(timezone.utc),
                'updatedAt': datetime.now(timezone.utc)
            }
            res = self.db['prendas'].insert_one(doc)
            return str(res.inserted_id)

        # Vía 2: Inserción vía endpoint REST /api/prendas
        url = f"{self.api_url}/api/prendas"
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.post(url, json=payload, timeout=20)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    prenda_id = data.get('data', {}).get('_id') or data.get('prenda', {}).get('_id') or 'ok'
                    return str(prenda_id)
                elif resp.status_code == 405 or resp.status_code == 404:
                    # Si el servidor no tiene implementado POST /api/prendas, intentar MongoDB
                    if self.mongo_uri and PYMONGO_AVAILABLE and not self.direct_db:
                        print("   ℹ️  POST /api/prendas devolvió 405/404. Conectando a MongoDB Atlas como fallback...")
                        client = MongoClient(self.mongo_uri)
                        db_name = self.mongo_uri.split('/')[-1].split('?')[0] or 'closet_digital'
                        doc = {**payload, 'createdAt': datetime.now(timezone.utc), 'updatedAt': datetime.now(timezone.utc)}
                        res = client[db_name]['prendas'].insert_one(doc)
                        return str(res.inserted_id)
                    raise RuntimeError(f"Endpoint /api/prendas rechazó POST ({resp.status_code}): {resp.text}")
                else:
                    print(f"   ⚠️  [Prendas Status {resp.status_code}] Intento {attempt}/{self.max_retries}: {resp.text[:150]}")
            except Exception as e:
                print(f"   ⚠️  [Prendas Excepción] Intento {attempt}/{self.max_retries}: {e}")

            time.sleep(2 * attempt)

        raise RuntimeError(f"Fallo al registrar prenda en catálogo tras {self.max_retries} intentos.")

    def process_image(self, image_path: Path) -> Dict[str, Any]:
        """Ejecuta el ciclo de vida completo de carga de una prenda simulando un usuario."""
        filename = image_path.name
        t0 = time.time()

        # 1. Compresión del lado del cliente
        orig_size_kb = image_path.stat().st_size / 1024
        compressed_bytes, data_uri = compress_image_client_simulation(image_path)
        comp_size_kb = len(compressed_bytes) / 1024
        print(f"📸 [1/4] Compresión cliente: {orig_size_kb:.1f}KB ➔ {comp_size_kb:.1f}KB ({len(data_uri)} chars)")

        # 2. Análisis con IA y autocompletado
        print(f"🤖 [2/4] Enviando a IA para autocompletado...")
        ia_data = self.analyze_image_with_ia(data_uri)
        nombre = ia_data['nombre']
        meta = ia_data['metadata']
        cat = meta['categoria']
        subcat = meta['subcategoria']
        colores = meta['colores']
        estilo = meta['estilo']
        clo = meta.get('climaClo')
        print(f"   ✨ Prenda identificada: '{nombre}'")
        print(f"   📋 [{cat} > {subcat}] Colores: {', '.join(colores)} | Estilo: {', '.join(estilo)} | CLO: {clo}")

        # 3. Subida a almacenamiento (AWS S3)
        print(f"☁️  [3/4] Procesando imagen (remoción de fondo + S3)...")
        s3_url = self.upload_image_to_storage(filename, compressed_bytes, cat)
        print(f"   🔗 Imagen alojada: {s3_url}")

        # 4. Persistencia en la plataforma
        print(f"💾 [4/4] Guardando prenda en base de datos...")
        prenda_payload = {
            'nombre': nombre,
            'imagenes': [s3_url],
            'estado': 'Disponible',
            'metadata': meta
        }
        prenda_id = self.register_prenda(prenda_payload)
        elapsed = time.time() - t0
        print(f"✅ Prenda registrada exitosamente en {elapsed:.2f}s (ID: {prenda_id})")

        return {
            'prenda_id': prenda_id,
            'nombre': nombre,
            's3_url': s3_url,
            'metadata': meta,
            'elapsed_sec': elapsed,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    def run(self, limit: Optional[int] = None, offset: int = 0, force: bool = False):
        """Ejecuta el procesamiento del lote de imágenes del dataset."""
        print("=" * 75)
        print("🚀 INICIADOR DE CARGA DE DATASET - ESTILO")
        print("=" * 75)
        print(f"📂 Carpeta dataset: {self.dataset_dir}")
        print(f"🌐 Servidor API:    {self.api_url}")
        print(f"📝 Archivo estado:  {self.progress_file}")
        print(f"⚙️  Modo Dry-Run:   {'SÍ' if self.dry_run else 'NO'}")
        print(f"💾 Modo Direct-DB:  {'SÍ' if self.direct_db else 'NO (HTTP API)'}")
        print("=" * 75)

        if not self.dataset_dir.exists():
            print(f"❌ Error: El directorio {self.dataset_dir} no existe.")
            return

        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        all_files = sorted([f for f in self.dataset_dir.iterdir() if f.suffix.lower() in valid_extensions])
        total_found = len(all_files)
        print(f"🔍 Total de imágenes encontradas en dataset: {total_found}")

        if offset > 0:
            all_files = all_files[offset:]
            print(f"⏭️  Saltando las primeras {offset} imágenes (Restantes: {len(all_files)})")

        if limit and limit > 0:
            all_files = all_files[:limit]
            print(f"🎯 Límite establecido para esta ejecución: {limit} prendas")

        already_uploaded = self.progress.get('uploaded', {})
        files_to_process = []
        for f in all_files:
            if not force and f.name in already_uploaded:
                continue
            files_to_process.append(f)

        print(f"📊 Prendas ya registradas previamente: {len(already_uploaded)}")
        print(f"▶️  Prendas pendientes a procesar:      {len(files_to_process)}\n")

        if not files_to_process:
            print("🎉 ¡Todas las imágenes solicitadas ya fueron subidas y procesadas!")
            return

        success_count = 0
        failed_count = 0
        start_time = time.time()

        for idx, img_file in enumerate(files_to_process, 1):
            print(f"\n[{idx}/{len(files_to_process)}] ── Procesando archivo: {img_file.name}")
            try:
                res = self.process_image(img_file)
                if not self.dry_run:
                    self.progress['uploaded'][img_file.name] = res
                    if img_file.name in self.progress['failed']:
                        del self.progress['failed'][img_file.name]
                    self._save_progress()
                success_count += 1
            except KeyboardInterrupt:
                print("\n\n🛑 Interrupción por el usuario (Ctrl+C). Guardando estado actual...")
                if not self.dry_run:
                    self._save_progress()
                print("💾 Progreso guardado. Puedes continuar en cualquier momento.")
                return
            except Exception as e:
                print(f"❌ Error al procesar {img_file.name}: {e}")
                if not self.dry_run:
                    self.progress['failed'][img_file.name] = {
                        'error': str(e),
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                    self._save_progress()
                failed_count += 1

            if idx < len(files_to_process) and self.delay > 0:
                time.sleep(self.delay)

        total_elapsed = time.time() - start_time
        print("\n" + "=" * 75)
        print("🏁 RESUMEN FINAL DEL PROCESAMIENTO")
        print("=" * 75)
        print(f"✅ Prendas procesadas con éxito: {success_count}")
        print(f"❌ Prendas fallidas:            {failed_count}")
        print(f"⏱️  Tiempo total transcurrido:    {total_elapsed:.1f} segundos")
        if success_count > 0:
            print(f"⚡ Promedio por prenda:          {total_elapsed / success_count:.2f} s/prenda")
        print(f"📄 Historial consolidado en:     {self.progress_file}")
        print("=" * 75)


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Sube prendas desde ./public/uploads/dataset/ a la plataforma Estilo simulando el flujo de usuario con IA."
    )
    parser.add_argument(
        '--dir',
        type=str,
        default='./public/uploads/dataset/',
        help="Ruta al directorio de imágenes (por defecto: ./public/uploads/dataset/)"
    )
    parser.add_argument(
        '--api-url',
        type=str,
        default=os.environ.get('ESTILO_BASE_URL', 'http://localhost:3000'),
        help="URL base del servidor Estilo (por defecto: $ESTILO_BASE_URL o http://localhost:3000)"
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help="Cantidad máxima de imágenes a procesar (ej: --limit 5 para pruebas, omitir o 0 para todas)"
    )
    parser.add_argument(
        '--offset',
        type=int,
        default=0,
        help="Número de imágenes a saltar desde el inicio"
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=0.8,
        help="Pausa en segundos entre prendas para control de rate-limit (por defecto: 0.8s)"
    )
    parser.add_argument(
        '--max-retries',
        type=int,
        default=3,
        help="Número máximo de reintentos por prenda en caso de error transitorio"
    )
    parser.add_argument(
        '--progress-file',
        type=str,
        default='./scripts/dataset_upload_progress.json',
        help="Ruta al archivo de persistencia de progreso JSON"
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help="Forzar reprocesamiento de imágenes aunque ya figuren como subidas"
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help="Simular todo el flujo y autocompletado con IA sin subir a S3 ni insertar en base de datos"
    )
    parser.add_argument(
        '--direct-db',
        action='store_true',
        help="Insertar directamente en MongoDB Atlas (usando MONGODB_URI) en lugar de HTTP POST /api/prendas"
    )
    return parser.parse_args()


def main():
    args = parse_arguments()
    dataset_path = Path(args.dir).resolve()
    progress_path = Path(args.progress_file).resolve()

    uploader = DatasetUploader(
        api_url=args.api_url,
        dataset_dir=dataset_path,
        progress_file=progress_path,
        delay=args.delay,
        max_retries=args.max_retries,
        dry_run=args.dry_run,
        direct_db=args.direct_db
    )

    limit = args.limit if (args.limit and args.limit > 0) else None
    uploader.run(limit=limit, offset=args.offset, force=args.force)


if __name__ == '__main__':
    main()
