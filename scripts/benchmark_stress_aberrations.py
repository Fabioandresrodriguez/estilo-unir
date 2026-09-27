#!/usr/bin/env python3
"""
benchmark_stress_aberrations.py
===============================
Genera pruebas de estrés y robustez sobre el modelo de visión multimodal de Estilo,
aplicando perturbaciones de imagen:
- Desenfoque Gaussiano (Blur)
- Desaturación (Escala de grises)
- Hipersaturación (3.5x)
- Aberración Cromática (desplazamiento de canales RGB)
- Subexposición / Iluminación baja (0.35x brillo)
- Sobreexposición / Quemado (1.9x brillo)
- Ruido Gaussiano Aditivo

Consume directamente la API:
POST https://estilo.dragodo.cloud/api/prendas/analyze-image

Genera cuadrículas visuales comparativas (Grid de aberraciones) con las predicciones
superpuestas sobre cada variante y exporta métricas de degradación.
"""

import os
import io
import json
import base64
import time
import math
import urllib.request
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont
import numpy as np

API_URL = os.environ.get('ESTILO_API_URL', 'https://estilo.dragodo.cloud/api/prendas/analyze-image')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'aberrations_output')
IMG_DIR = '/Users/drago/code/clothing-dataset/images'
OBSIDIAN_OUTPUT_DIR = '/Users/drago/Library/CloudStorage/GoogleDrive-dragodominguezfb@gmail.com/Mi unidad/Obsidian/UNIR/Semestre 3/Seminario de inovacion e inteligencia artificial/Entregables/3.Entregable 2/contexto/Clase 5'

# Lista de prendas arquetípicas para someter a estrés
TEST_GARMENTS = [
    {
        'id': 'ea7b6656-3f84-4eb3-9099-23e623fc1018',
        'nombre_base': 'Camiseta Burdeos',
        'categoria_esperada': 'Superior',
        'subcategoria_esperada': 'Camiseta'
    },
    {
        'id': 'c995c900-693d-4dd6-8995-43f3051ec488',
        'nombre_base': 'Pantalón Negro',
        'categoria_esperada': 'Inferior',
        'subcategoria_esperada': 'Pantalón'
    },
    {
        'id': '3b86d877-2b9e-4c8b-a6a2-1d87513309d0',
        'nombre_base': 'Botas Negras',
        'categoria_esperada': 'Calzado',
        'subcategoria_esperada': 'Botas'
    },
    {
        'id': '1b2ace0a-382e-4b87-8e9d-35cbcfac636b',
        'nombre_base': 'Chamarra Outwear',
        'categoria_esperada': 'Superior',
        'subcategoria_esperada': 'Chamarra'
    }
]

def apply_chromatic_aberration(img: Image.Image, offset: int = 12) -> Image.Image:
    """Separa canales R, G, B y desplaza el canal Rojo a la izquierda y Azul a la derecha."""
    img_rgb = img.convert('RGB')
    r, g, b = img_rgb.split()
    
    # Desplazar R
    r_shifted = Image.new('L', img.size, 0)
    r_shifted.paste(r, (-offset, 0))
    
    # Desplazar B
    b_shifted = Image.new('L', img.size, 0)
    b_shifted.paste(b, (offset, 0))
    
    return Image.merge('RGB', (r_shifted, g, b_shifted))

def apply_gaussian_noise(img: Image.Image, sigma: float = 35.0) -> Image.Image:
    """Añade ruido Gaussiano a los canales de la imagen."""
    arr = np.array(img.convert('RGB'), dtype=np.float32)
    noise = np.random.normal(0, sigma, arr.shape)
    noisy_arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(noisy_arr)

def generate_perturbed_variants(base_img: Image.Image) -> list:
    """Genera las 8 variantes del experimento de estrés."""
    variants = []
    
    # 1. Original (Control)
    variants.append(('Original (Control)', base_img.copy()))
    
    # 2. Desenfoque Gaussiano Fuerte (Blur)
    blur_img = base_img.filter(ImageFilter.GaussianBlur(radius=6.0))
    variants.append(('Desenfoque (Blur r=6)', blur_img))
    
    # 3. Desaturación Total (Escala de Grises)
    gray_img = ImageEnhance.Color(base_img).enhance(0.0)
    variants.append(('Desaturación (0% Color)', gray_img))
    
    # 4. Hipersaturación Cromática (3.5x)
    sat_img = ImageEnhance.Color(base_img).enhance(3.5)
    variants.append(('Hipersaturación (3.5x)', sat_img))
    
    # 5. Aberración Cromática (Separación RGB)
    aberr_img = apply_chromatic_aberration(base_img, offset=14)
    variants.append(('Aberración Cromática', aberr_img))
    
    # 6. Subexposición / Baja Luminosidad (Oscuro)
    dark_img = ImageEnhance.Brightness(base_img).enhance(0.35)
    dark_img = ImageEnhance.Contrast(dark_img).enhance(1.4)
    variants.append(('Baja Luz (0.35x Brillo)', dark_img))
    
    # 7. Sobreexposición / Quemado de Luz
    bright_img = ImageEnhance.Brightness(base_img).enhance(1.85)
    bright_img = ImageEnhance.Contrast(bright_img).enhance(0.85)
    variants.append(('Sobreexposición (1.85x)', bright_img))
    
    # 8. Ruido Gaussiano Aditivo
    noise_img = apply_gaussian_noise(base_img, sigma=35.0)
    variants.append(('Ruido Gaussiano (σ=35)', noise_img))
    
    return variants

def query_vision_api(img: Image.Image) -> dict:
    """Envía la imagen a la API de Estilo y retorna la respuesta procesada."""
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=85)
    img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    payload = json.dumps({'image': f'data:image/jpeg;base64,{img_b64}'}).encode('utf-8')
    req = urllib.request.Request(API_URL, data=payload, headers={'Content-Type': 'application/json'})
    
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            elapsed = time.time() - t0
            data = json.loads(resp.read().decode('utf-8'))
            meta = data.get('metadata', {})
            return {
                'success': True,
                'status': resp.status,
                'categoria': meta.get('categoria', 'Desconocido'),
                'subcategoria': meta.get('subcategoria', 'Desconocido'),
                'colores': meta.get('colores', []),
                'estilo': meta.get('estilo', []),
                'climaClo': meta.get('climaClo', None),
                'latency_s': elapsed
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'categoria': 'Error',
            'subcategoria': 'Error',
            'colores': [],
            'latency_s': time.time() - t0
        }

def render_cell(img: Image.Image, label_name: str, pred_info: dict, expected_cat: str, cell_w: int = 340, cell_h: int = 420) -> Image.Image:
    """Renderiza una celda individual con la imagen y su ficha diagnóstica superpuesta."""
    cell = Image.new('RGB', (cell_w, cell_h), color=(24, 24, 27))
    draw = ImageDraw.Draw(cell)
    
    # Escalar imagen para que ocupe la parte superior
    img_target_h = 270
    img_resized = img.copy()
    img_resized.thumbnail((cell_w - 20, img_target_h - 20), Image.Resampling.LANCZOS)
    
    # Centrar imagen en la parte superior
    offset_x = (cell_w - img_resized.width) // 2
    offset_y = 10 + (img_target_h - img_resized.height) // 2
    cell.paste(img_resized, (offset_x, offset_y))
    
    # Evaluar acierto
    pred_cat = pred_info.get('categoria', '')
    is_correct = (pred_cat.lower() == expected_cat.lower())
    
    # Fondo del panel inferior de metadatos
    panel_y = 275
    draw.rectangle([(8, panel_y), (cell_w - 8, cell_h - 10)], fill=(39, 39, 42), outline=(63, 63, 70), width=1)
    
    # Insignia de estado (Badge)
    badge_color = (34, 197, 94) if is_correct else (239, 68, 68)
    badge_text = "PASS" if is_correct else "FAIL"
    draw.rectangle([(cell_w - 65, panel_y + 8), (cell_w - 18, panel_y + 26)], fill=badge_color)
    draw.text((cell_w - 58, panel_y + 11), badge_text, fill=(255, 255, 255))
    
    # Textos de información
    draw.text((16, panel_y + 8), label_name[:24], fill=(250, 204, 21)) # Título de la perturbación (amarillo)
    draw.text((16, panel_y + 32), f"Cat: {pred_cat}", fill=(255, 255, 255))
    draw.text((16, panel_y + 52), f"Sub: {pred_info.get('subcategoria', '')}", fill=(200, 200, 200))
    col_str = ", ".join(pred_info.get('colores', []))
    draw.text((16, panel_y + 72), f"Col: {col_str[:22]}", fill=(160, 160, 255))
    draw.text((16, panel_y + 92), f"Lat: {pred_info.get('latency_s', 0):.2f}s | clo: {pred_info.get('climaClo')}", fill=(150, 150, 150))
    
    return cell

def create_aberrations_grid(garment_spec: dict):
    img_path = os.path.join(IMG_DIR, garment_spec['id'] + '.jpg')
    if not os.path.exists(img_path):
        print(f"No existe la imagen base {img_path}")
        return None
    
    base_img = Image.open(img_path)
    variants = generate_perturbed_variants(base_img)
    
    print(f"\n--- Evaluando {garment_spec['nombre_base']} ({len(variants)} variantes) ---")
    
    cell_w, cell_h = 340, 420
    cols, rows = 4, 2
    grid_w = cols * cell_w + (cols + 1) * 15
    grid_h = rows * cell_h + (rows + 1) * 15 + 80 # Espacio para header
    
    grid_img = Image.new('RGB', (grid_w, grid_h), color=(9, 9, 11))
    grid_draw = ImageDraw.Draw(grid_img)
    
    # Header del grid
    grid_draw.text((25, 20), f"BENCHMARK DE ESTRÉS Y ABERRACIONES — {garment_spec['nombre_base'].upper()}", fill=(255, 255, 255))
    grid_draw.text((25, 48), f"Categoría Esperada: {garment_spec['categoria_esperada']} | Subcategoría: {garment_spec['subcategoria_esperada']} | Endpoint: {API_URL}", fill=(161, 161, 170))
    
    variant_results = []
    
    for idx, (lbl, var_img) in enumerate(variants):
        print(f"  [{idx+1}/8] Invocando API para {lbl}...")
        pred = query_vision_api(var_img)
        print(f"       Resultado -> Cat: {pred.get('categoria')} | Sub: {pred.get('subcategoria')} | Col: {pred.get('colores')} | T: {pred.get('latency_s', 0):.2f}s")
        
        variant_results.append({
            'perturbacion': lbl,
            'categoria_predicha': pred.get('categoria'),
            'subcategoria_predicha': pred.get('subcategoria'),
            'colores_predichos': pred.get('colores'),
            'climaClo': pred.get('climaClo'),
            'latencia_s': pred.get('latency_s'),
            'correcto': (pred.get('categoria', '').lower() == garment_spec['categoria_esperada'].lower())
        })
        
        cell_img = render_cell(var_img, lbl, pred, garment_spec['categoria_esperada'], cell_w, cell_h)
        
        c = idx % cols
        r = idx // cols
        pos_x = 15 + c * (cell_w + 15)
        pos_y = 80 + r * (cell_h + 15)
        grid_img.paste(cell_img, (pos_x, pos_y))
    
    # Guardar imagen en carpetas de salida
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(OBSIDIAN_OUTPUT_DIR, exist_ok=True)
    
    safe_name = garment_spec['nombre_base'].lower().replace(' ', '_')
    out_file_local = os.path.join(OUTPUT_DIR, f"grid_aberraciones_{safe_name}.png")
    out_file_obsidian = os.path.join(OBSIDIAN_OUTPUT_DIR, f"grid_aberraciones_{safe_name}.png")
    
    grid_img.save(out_file_local, quality=95)
    grid_img.save(out_file_obsidian, quality=95)
    
    print(f"✅ Grid guardado en:\n   - {out_file_local}\n   - {out_file_obsidian}")
    
    return {
        'prenda': garment_spec['nombre_base'],
        'id': garment_spec['id'],
        'grid_path': out_file_obsidian,
        'variantes': variant_results
    }

def main():
    print("==================================================================")
    print(" INICIANDO BENCHMARK DE ESTRÉS VISUAL Y ABERRACIONES DE IMAGEN   ")
    print("==================================================================")
    
    all_benchmark_data = []
    
    # Ejecutar para las 2 prendas clave (Camiseta y Pantalón) para generar cuadrículas completas
    for garment in TEST_GARMENTS[:2]:
        res = create_aberrations_grid(garment)
        if res:
            all_benchmark_data.append(res)
    
    json_path = os.path.join(OUTPUT_DIR, 'aberrations_benchmark_results.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_benchmark_data, f, indent=2, ensure_ascii=False)
        
    print("\n==================================================================")
    print(f" BENCHMARK COMPLETADO — Resultados guardados en {json_path}")
    print("==================================================================")

if __name__ == '__main__':
    main()
