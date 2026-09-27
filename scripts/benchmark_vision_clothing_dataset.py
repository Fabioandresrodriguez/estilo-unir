#!/usr/bin/env python3
"""
benchmark_vision_clothing_dataset.py
====================================
Evaluación cuantitativa rigurosa del modelo multimodal de visión computacional de Estilo
contra el Ground Truth de referencia para el subconjunto estratificado del Clothing Dataset.

Métricas calculadas:
1. Exactitud en Categoría Principal (Top-1) + IC 95% Wilson Score
2. Exactitud en Subcategoría + IC 95% Wilson Score
3. Concordancia Cromática Real (Intersección con Ground Truth) + IC 95% Wilson Score
4. Inferencia de Ocasiones Multi-etiqueta (Precision, Recall, Macro F1-Score)
5. Latencias (P50, P90, P95, Promedio)

Consume directamente el endpoint en producción:
POST https://estilo.dragodo.cloud/api/prendas/analyze-image
"""

import csv
import json
import os
import urllib.request
import base64
import time
import math
from collections import defaultdict

BASE_DIR = os.path.dirname(__file__)
GT_PATH = os.path.join(BASE_DIR, 'ground_truth_eval.json')
CSV_PATH = '/Users/drago/code/clothing-dataset/images.csv'
IMG_DIR = '/Users/drago/code/clothing-dataset/images'
API_URL = os.environ.get('ESTILO_API_URL', 'https://estilo.dragodo.cloud/api/prendas/analyze-image')

def calculate_wilson_ci(k, n, z=1.96):
    if n == 0:
        return 0.0, 0.0
    p = k / n
    denom = 1 + (z**2) / n
    center = (p + (z**2) / (2 * n)) / denom
    margin = z * math.sqrt((p * (1 - p) / n) + (z**2) / (4 * (n**2))) / denom
    return max(0.0, center - margin) * 100, min(1.0, center + margin) * 100

def run_benchmark():
    print(f"=== INICIANDO BENCHMARK RIGUROSO DE VISIÓN MULTIMODAL ESTILO ===")
    print(f"Ground Truth: {GT_PATH}")
    print(f"Endpoint:     {API_URL}\n")

    if not os.path.exists(GT_PATH):
        raise FileNotFoundError(f"No se encontró Ground Truth en {GT_PATH}")

    with open(GT_PATH, 'r', encoding='utf-8') as f:
        ground_truth = json.load(f)

    sample_ids = list(ground_truth.keys())
    n = len(sample_ids)
    print(f"Muestra estratificada de prueba: {n} prendas con Ground Truth verificado.")

    results = []
    latencies = []
    cat_correct = 0
    subcat_correct = 0
    color_correct = 0

    confusion_matrix = defaultdict(lambda: defaultdict(int))
    
    # Métricas para ocasiones multi-etiqueta (TP, FP, FN por ocasión)
    ALL_OCASIONES = ['Social', 'Trabajo', 'Hogar', 'Fiesta', 'Formal']
    tp_occ = defaultdict(int)
    fp_occ = defaultdict(int)
    fn_occ = defaultdict(int)

    for idx, img_id in enumerate(sample_ids):
        gt = ground_truth[img_id]
        img_path = os.path.join(IMG_DIR, f"{img_id}.jpg")
        
        if not os.path.exists(img_path):
            print(f"Advertencia: No existe {img_path}")
            continue

        with open(img_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')

        payload = json.dumps({'image': f'data:image/jpeg;base64,{b64}'}).encode('utf-8')
        req = urllib.request.Request(API_URL, data=payload, headers={'Content-Type': 'application/json'})

        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=35) as resp:
                elapsed = time.time() - t0
                latencies.append(elapsed)
                data = json.loads(resp.read().decode('utf-8'))
                
                meta = data.get('metadata', {})
                pred_cat = meta.get('categoria', 'Desconocido')
                pred_subcat = meta.get('subcategoria', 'Desconocido')
                pred_colores = meta.get('colores', [])
                pred_ocasiones = meta.get('ocasiones', [])
                pred_clo = meta.get('climaClo', None)

                # 1. Evaluación de Categoría
                norm_pred_cat = 'Accesorio' if pred_cat.lower().startswith('accesori') else pred_cat
                is_cat_ok = (norm_pred_cat.lower() == gt['cat'].lower())
                if is_cat_ok:
                    cat_correct += 1
                confusion_matrix[gt['cat']][norm_pred_cat] += 1

                # 2. Evaluación de Subcategoría
                is_subcat_ok = (
                    pred_subcat.lower() == gt['subcat'].lower() or
                    (gt['subcat'] == 'Pantalón' and pred_subcat in ['Pantalón', 'Jeans', 'Joggers']) or
                    (gt['subcat'] == 'Shorts' and pred_subcat in ['Shorts', 'Bermuda']) or
                    (gt['subcat'] == 'Camiseta' and pred_subcat in ['Camiseta', 'Top']) or
                    (gt['subcat'] == 'Top' and pred_subcat in ['Top', 'Camiseta', 'Blusa']) or
                    (gt['subcat'] == 'Botas' and pred_subcat in ['Botas', 'Zapatos']) or
                    (gt['subcat'] == 'Sneakers' and pred_subcat in ['Sneakers', 'Tenis']) or
                    (gt['subcat'] == 'Gorra' and pred_subcat in ['Gorra', 'Sombrero'])
                )
                if is_subcat_ok:
                    subcat_correct += 1

                # 3. Evaluación Cromática Real
                gt_colors = [c.lower() for c in gt.get('color', [])]
                pred_colors_lower = [c.lower() for c in pred_colores]
                is_color_ok = any(c in pred_colors_lower for c in gt_colors) or any(c in gt_colors for c in pred_colors_lower)
                if is_color_ok:
                    color_correct += 1

                # 4. Evaluación de Ocasiones Multi-etiqueta
                gt_occ = set(gt.get('ocasiones', []))
                pred_occ = set(pred_ocasiones)
                for occ in ALL_OCASIONES:
                    in_gt = occ in gt_occ
                    in_pred = occ in pred_occ
                    if in_gt and in_pred:
                        tp_occ[occ] += 1
                    elif not in_gt and in_pred:
                        fp_occ[occ] += 1
                    elif in_gt and not in_pred:
                        fn_occ[occ] += 1

                results.append({
                    'id': img_id,
                    'expected_cat': gt['cat'],
                    'pred_cat': norm_pred_cat,
                    'cat_ok': is_cat_ok,
                    'expected_subcat': gt['subcat'],
                    'pred_subcat': pred_subcat,
                    'subcat_ok': is_subcat_ok,
                    'expected_colors': gt['color'],
                    'pred_colors': pred_colores,
                    'color_ok': is_color_ok,
                    'expected_ocasiones': list(gt_occ),
                    'pred_ocasiones': list(pred_occ),
                    'latency_s': elapsed
                })
                print(f"[{idx+1:02d}/{n}] Cat: {norm_pred_cat:<10} ({'OK' if is_cat_ok else 'FAIL'}) | Sub: {pred_subcat:<10} | Col: {','.join(pred_colores):<12} ({'OK' if is_color_ok else 'FAIL'}) | T: {elapsed:.2f}s")
        except Exception as ex:
            print(f"[{idx+1:02d}/{n}] ERROR en {img_id}: {ex}")
            time.sleep(1)

    # Computar Macro F1 para ocasiones
    f1_list = []
    prec_list = []
    rec_list = []
    occ_report = {}
    for occ in ALL_OCASIONES:
        tp = tp_occ[occ]
        fp = fp_occ[occ]
        fn = fn_occ[occ]
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        f1_list.append(f1)
        prec_list.append(prec)
        rec_list.append(rec)
        occ_report[occ] = {'tp': tp, 'fp': fp, 'fn': fn, 'precision': round(prec, 3), 'recall': round(rec, 3), 'f1': round(f1, 3)}

    macro_f1 = sum(f1_list) / len(f1_list)
    macro_prec = sum(prec_list) / len(prec_list)
    macro_rec = sum(rec_list) / len(rec_list)

    acc_cat = (cat_correct / n) * 100
    acc_subcat = (subcat_correct / n) * 100
    acc_color = (color_correct / n) * 100

    ci_cat = calculate_wilson_ci(cat_correct, n)
    ci_sub = calculate_wilson_ci(subcat_correct, n)
    ci_col = calculate_wilson_ci(color_correct, n)

    latencies.sort()
    avg_lat = sum(latencies) / n
    p50_lat = latencies[int(n * 0.50)]
    p90_lat = latencies[int(n * 0.90)]
    p95_lat = latencies[int(n * 0.95)]

    print("\n=======================================================")
    print("      REPORTE FINAL RIGUROSO DE VISIÓN MULTIMODAL      ")
    print("=======================================================")
    print(f"Total prendas evaluadas:         {n}")
    print(f"Exactitud Categoría:            {acc_cat:.1f}% [IC 95%: {ci_cat[0]:.1f}%, {ci_cat[1]:.1f}%]")
    print(f"Exactitud Subcategoría:         {acc_subcat:.1f}% [IC 95%: {ci_sub[0]:.1f}%, {ci_sub[1]:.1f}%]")
    print(f"Concordancia Cromática Real:    {acc_color:.1f}% [IC 95%: {ci_col[0]:.1f}%, {ci_col[1]:.1f}%]")
    print(f"Inferencia Ocasiones Macro-F1:  {macro_f1:.3f} (Prec: {macro_prec:.3f}, Rec: {macro_rec:.3f})")
    print(f"Latencia promedio:              {avg_lat:.2f}s (P50: {p50_lat:.2f}s, P95: {p95_lat:.2f}s)")
    print("\nDesglose por Ocasión:")
    for occ, m in occ_report.items():
        print(f"  {occ:<10} -> Prec: {m['precision']:.2f}, Rec: {m['recall']:.2f}, F1: {m['f1']:.2f} (TP={m['tp']}, FP={m['fp']}, FN={m['fn']})")

    output_path = os.path.join(BASE_DIR, 'vision_benchmark_results.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total_muestras': n,
            'exactitud_categoria': acc_cat,
            'ci_categoria': list(ci_cat),
            'exactitud_subcategoria': acc_subcat,
            'ci_subcategoria': list(ci_sub),
            'concordancia_color': acc_color,
            'ci_color': list(ci_col),
            'macro_f1_ocasiones': macro_f1,
            'desglose_ocasiones': occ_report,
            'latencias': {'avg': avg_lat, 'p50': p50_lat, 'p90': p90_lat, 'p95': p95_lat},
            'detalles': results
        }, f, indent=2, ensure_ascii=False)
    print(f"\nResultados guardados en: {output_path}")

if __name__ == '__main__':
    run_benchmark()
