# HU-11: Flujo de Captura de Contexto mediante Q&A Conversacional e Input de Voz (STT/TTS)

## 📝 Descripción (Formato Connextra)
* **Como** usuario del Clóset Digital,
* **Quiero** hablar directamente con el recomendador de outfits a través de mi micrófono y escuchar sus sugerencias por audio mediante síntesis de voz,
* **Para** experimentar una conversación fluida asistida por IA (STT y TTS) que entienda mi contexto diario de manera manos libres.

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Transcripción de voz a texto exitosa (Speech-to-Text)
* **Dado que** el usuario presiona "Hablar" y el micrófono está activo en `/prendas/recomendacion-hoy`,
* **Cuando** el usuario pronuncia "Hoy tengo una reunión formal de negocios en la oficina y hace mucho frío",
* **Entonces** el motor de reconocimiento de voz del navegador (`webkitSpeechRecognition` o `SpeechRecognition`) transcribe la frase en tiempo real a la caja de texto conversacional,
* **Y** compila las variables detectadas (ocasión: "Formal", estilo: "Oficina", clima: "Frío") en el estado del componente.

### Escenario 2: Respuesta hablada del asistente de IA (Text-to-Speech)
* **Dado que** la IA ha retornado las recomendaciones de outfits al cliente,
* **Cuando** se despliega la pantalla de resultados del recomendador,
* **Entonces** el sistema inicia automáticamente la síntesis de voz del navegador (`SpeechSynthesisUtterance`) para leer en voz alta la justificación estilística de los conjuntos propuestos (ej: "He seleccionado un conjunto formal con tonos oscuros y abrigo grueso para mantenerte abrigado..."),
* **Y** provee controles visuales brutalistas para pausar o repetir el audio.

### Escenario 3: Fallback a entrada de texto e interacción manual
* **Dado que** el usuario se encuentra en un entorno con mucho ruido o el navegador no es compatible con el reconocimiento de voz de la Web Speech API,
* **Cuando** el reconocimiento de voz falla o se cancela,
* **Entonces** el asistente desactiva el micrófono, muestra un aviso aclaratorio,
* **Y** expone de inmediato el cuadro de entrada de texto manual y los chips brutalistas de ocasiones y clima para que el usuario complete el flujo por escrito.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Tecnología Recomendada:** Debe utilizarse la **Web Speech API** nativa (disponible en la mayoría de navegadores modernos como Chrome, Safari y Edge, la cual delega la transcripción y síntesis directamente a los servicios optimizados de Google/Apple en el sistema operativo).
* **Idioma:** El reconocimiento de voz y la voz de síntesis (TTS) deben estar configurados explícitamente en idioma español latinoamericano o de España (`lang: 'es-MX'` o `'es-ES'`).
* **Accesibilidad (WCAG 2.2):**
  - Todas las transcripciones de voz deben mostrarse de forma textual en la pantalla para usuarios con dificultades auditivas.
  - Los estados del micrófono (Escuchando, Silenciado, Procesando) deben ser comunicados de forma inequívoca de forma visual y para lectores de pantalla.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Es la característica principal del asistente de outfits conversacional).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** HU-10 (Requiere la interfaz del espectrograma).
* **Notas Técnicas Adicionales:**
  - Instanciar `const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition` dentro del componente del cliente.
  - Usar la propiedad `continuous = false` e `interimResults = true` para mostrar texto optimista mientras el usuario habla.
  - Para el TTS, invocar `window.speechSynthesis.speak(new SpeechSynthesisUtterance(textoRecomendacion))`.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU11 feat: integración de Web Speech API para control de voz STT y respuesta hablada TTS`).
