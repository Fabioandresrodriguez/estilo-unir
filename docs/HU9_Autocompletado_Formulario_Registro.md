# HU-9: Autocompletado del Formulario de Registro por Inferencia de Imagen

## 📝 Descripción (Formato Connextra)
* **Como** usuario que registra una prenda en el Clóset Digital,
* **Quiero** que el sistema comprima la imagen en el cliente utilizando el algoritmo establecido en HU1.1 antes de enviarla a la API de IA en formato base64,
* **Para** optimizar el peso de la solicitud HTTP (payload), reducir la latencia de carga móvil, prevenir errores de tamaño de petición y pre-llenar los metadatos de forma rápida y eficiente.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Compresión exitosa previa al envío para análisis de IA
* **Dado que** el usuario ingresa a `/prendas/registrar` y selecciona/captura una imagen de prenda,
* **Cuando** el sistema procesa la imagen para iniciar el autocompletado con IA,
* **Entonces** ejecuta primero la rutina de compresión de imágenes en el cliente (reduciendo calidad y dimensiones físicas),
* **Y** genera la versión base64 optimizada (menor a 1.5MB) para despacharla a la API de análisis visual `/api/prendas/analyze-image`.

### Escenario 2: Autocompletado exitoso tras la compresión
* **Dado que** la API recibe la imagen comprimida en base64,
* **Cuando** la respuesta del Route Handler con los metadatos llega de vuelta de forma rápida (latencia menor),
* **Entonces** el cliente actualiza automáticamente los valores del formulario mediante `setValue` de `react-hook-form` y los expone al usuario.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Reutilización de Algoritmo:** Debe aplicarse estrictamente la lógica de compresión de la HU1.1 (usando un canvas en el cliente o la biblioteca correspondiente) reduciendo el tamaño de la imagen a un ancho/alto máximo de `1024px` y calidad del `80%` en formato JPEG/WebP.
* **Flujo Secundario:** En caso de que falle la compresión, el sistema debe intentar enviar la imagen original o desbloquear el formulario inmediatamente para permitir el ingreso 100% manual.
* **Accesibilidad (WCAG 2.2):** Se debe anunciar el estado de compresión y posterior análisis mediante un lector de pantallas utilizando mensajes visuales y de región en vivo (`aria-live="polite"`).

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Optimización crítica de red y estabilidad).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** HU-1.1 (Compresión de imágenes) y HU-8 (API de análisis de imágenes).
* **Notas Técnicas Adicionales:**
  - Integrar la compresión en la función que maneja el cambio de archivos/cámara en `app/prendas/registrar/page.tsx`.
  - Una vez obtenida la imagen optimizada (Blob/File), convertirla a base64 mediante `FileReader` e invocar a la API de análisis usando `fetch`.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU9 feat: compresión en cliente previa al envío a la API de análisis visual e inicio del autocompletado`).
