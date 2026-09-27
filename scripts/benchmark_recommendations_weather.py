#!/usr/bin/env python3
"""
benchmark_recommendations_weather.py
====================================
Evaluación cuantitativa del motor de recomendaciones híbrido de Estilo
bajo múltiples matrices de contexto (temperatura, lluvia y ocasión).

Consume directamente el endpoint en producción:
POST https://estilo.dragodo.cloud/api/recomendaciones
"""

import urllib.request
import json
import time
import os

BASE_URL = os.environ.get('ESTILO_BASE_URL', 'https://estilo.dragodo.cloud')

TEST_SCENARIOS = [
    # Escenarios Fríos (T <= 10°C)
    {'temperatura': 4, 'lluvia': False, 'ocasion': 'Trabajo', 'label': 'Frío Extremo / Trabajo'},
    {'temperatura': 7, 'lluvia': True, 'ocasion': 'Social', 'label': 'Frío Lluvioso / Social'},
    {'temperatura': 9, 'lluvia': False, 'ocasion': 'Formal', 'label': 'Frío / Formal'},
    {'temperatura': 10, 'lluvia': False, 'ocasion': 'Hogar', 'label': 'Frío / Hogar'},
    
    # Escenarios Frescos / Templados (11°C <= T <= 20°C)
    {'temperatura': 12, 'lluvia': False, 'ocasion': 'Trabajo', 'label': 'Fresco / Trabajo'},
    {'temperatura': 15, 'lluvia': True, 'ocasion': 'Hogar', 'label': 'Fresco Lluvia / Hogar'},
    {'temperatura': 16, 'lluvia': False, 'ocasion': 'Social', 'label': 'Templado / Social'},
    {'temperatura': 18, 'lluvia': False, 'ocasion': 'Fiesta', 'label': 'Templado / Fiesta'},
    {'temperatura': 20, 'lluvia': True, 'ocasion': 'Trabajo', 'label': 'Templado Lluvia / Trabajo'},
    
    # Escenarios Cálidos / Calurosos (T >= 21°C)
    {'temperatura': 22, 'lluvia': False, 'ocasion': 'Trabajo', 'label': 'Cálido / Trabajo'},
    {'temperatura': 25, 'lluvia': False, 'ocasion': 'Social', 'label': 'Cálido / Social'},
    {'temperatura': 28, 'lluvia': False, 'ocasion': 'Fiesta', 'label': 'Caluroso / Fiesta'},
    {'temperatura': 30, 'lluvia': False, 'ocasion': 'Hogar', 'label': 'Calor Extremo / Hogar'},
    {'temperatura': 32, 'lluvia': False, 'ocasion': 'Social', 'label': 'Calor Extremo / Social'}
]

def run_recommendations_benchmark():
    print("=== INICIANDO BENCHMARK DEL MOTOR DE RECOMENDACIONES ESTILO ===")
    print(f"Base URL: {BASE_URL}\n")

    # 1. Obtener catálogo completo para verificar disponibilidad
    req_prendas = urllib.request.Request(
        f'{BASE_URL}/api/prendas?limit=100',
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req_prendas) as resp:
        catalog = json.loads(resp.read().decode('utf-8')).get('data', [])

    catalog_dict = {p['_id']: p for p in catalog}
    print(f"Prendas cargadas del catálogo activo: {len(catalog_dict)}")

    results = []
    total_outfits = 0
    available_outfits = 0
    latencies = []

    for idx, sc in enumerate(TEST_SCENARIOS):
        t0 = time.time()
        payload = json.dumps({
            'temperatura': sc['temperatura'],
            'lluvia': sc['lluvia'],
            'ocasion': sc['ocasion']
        }).encode('utf-8')

        req = urllib.request.Request(
            f'{BASE_URL}/api/recomendaciones',
            data=payload,
            headers={'Content-Type': 'application/json'}
        )

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                elapsed = time.time() - t0
                latencies.append(elapsed)
                res = json.loads(resp.read().decode('utf-8'))
                outfits = res.get('outfits', [])
                
                is_scenario_available = True
                outfit_details = []

                for o in outfits:
                    total_outfits += 1
                    p_ids = o.get('prendas', [])
                    p_objects = [catalog_dict.get(pid) for pid in p_ids if pid in catalog_dict]
                    
                    # Verificación de disponibilidad
                    outfit_all_disp = all(p.get('estado') == 'Disponible' for p in p_objects if p)
                    if outfit_all_disp and len(p_objects) >= 2:
                        available_outfits += 1
                    else:
                        is_scenario_available = False

                    outfit_details.append({
                        'nombre': o.get('nombre'),
                        'prendas_ids': p_ids,
                        'prendas_nombres': [p.get('nombre') for p in p_objects if p],
                        'disponibles': outfit_all_disp,
                        'justificacion': o.get('justificacionEstilo')
                    })

                results.append({
                    'escenario': sc['label'],
                    'parametros': sc,
                    'outfits_generados': len(outfits),
                    'disponibilidad_valida': is_scenario_available,
                    'latencia_s': elapsed,
                    'outfits': outfit_details
                })

                print(f"[{idx+1:02d}/{len(TEST_SCENARIOS)}] {sc['label']:<30} -> {len(outfits)} outfits | Disp: {'100%' if is_scenario_available else 'FAIL'} | T: {elapsed:.2f}s")
        except Exception as ex:
            print(f"[{idx+1:02d}/{len(TEST_SCENARIOS)}] ERROR en {sc['label']}: {ex}")

    disp_rate = (available_outfits / total_outfits) * 100 if total_outfits > 0 else 0.0
    avg_lat = sum(latencies) / len(latencies) if latencies else 0.0

    print("\n=======================================================")
    print("      REPORTE FINAL DE VALIDACIÓN DE RECOMENDACIONES   ")
    print("=======================================================")
    print(f"Total escenarios evaluados:    {len(TEST_SCENARIOS)}")
    print(f"Total outfits generados:       {total_outfits}")
    print(f"Tasa de disponibilidad lógica: {disp_rate:.1f}% ({available_outfits}/{total_outfits})")
    print(f"Latencia promedio:             {avg_lat:.2f}s")

    output_path = os.path.join(os.path.dirname(__file__), 'recommendations_benchmark_results.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total_escenarios': len(TEST_SCENARIOS),
            'total_outfits': total_outfits,
            'tasa_disponibilidad': disp_rate,
            'latencia_promedio_s': avg_lat,
            'detalles': results
        }, f, indent=2, ensure_ascii=False)
    print(f"\nResultados guardados en: {output_path}")

if __name__ == '__main__':
    run_recommendations_benchmark()
