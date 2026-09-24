# HU-14: Carrusel de Outfits a Pantalla Completa, Confirmación y Cambio de Estado de las Prendas

## 📝 Descripción (Formato Connextra)
* **Como** usuario del Clóset Digital que ha recibido recomendaciones de ropa,
* **Quiero** navegar entre las propuestas mediante un carrusel interactivo a pantalla completa que exponga las fotos reales de mis prendas y la justificación de la IA,
* **Para** elegir de manera inmersiva el conjunto ideal para vestir hoy, confirmando mi selección, registrando históricamente mi elección y enviando automáticamente las prendas elegidas al cesto de ropa sucia (`Sucio`).

---

## 📋 Criterios de Aceptación (Formato BDD - Gherkin)

### Escenario 1: Visualización interactiva y navegación del carrusel de outfits
* **Dado que** la API del recomendador por IA ha devuelto con éxito las combinaciones sugeridas,
* **Cuando** el usuario ingresa a la vista de resultados,
* **Entonces** se despliega un carrusel a pantalla completa (`full-screen`) que muestra en mosaicos/tarjetas brutalistas las fotos reales de las prendas del Outfit 1 y su explicación de estilo,
* **Y** permite deslizar lateralmente (swipe/drag) para cambiar a la tarjeta con los detalles del Outfit 2 y Outfit 3 de forma fluida.

### Escenario 2: Selección y confirmación de vestir un Outfit sugerido
* **Dado que** el usuario se encuentra visualizando la tarjeta con la propuesta de "Outfit 2",
* **Cuando** presiona el botón principal "Vestirme con este Outfit",
* **Entonces** la aplicación ejecuta una acción en el servidor que crea el registro histórico del Outfit en MongoDB,
* **Y** cambia de forma masiva el estado de todas las prendas que componen el "Outfit 2" (ej: camisa, pantalón, tenis) a `Sucio` en la base de datos,
* **Y** redirige al usuario de vuelta a la página de inicio mostrando un mensaje de éxito.

---

## ⚠️ Restricciones y Reglas de Negocio
* **Flujo de Transición:** Al confirmar un Outfit, el estado (`estado`) de todas las prendas involucradas debe actualizarse a `Sucio` de manera atómica. Esto previene que dichas prendas sean sugeridas en recomendaciones posteriores el mismo día o antes de ser lavadas.
* **Presentación Visual de Prendas:** Las imágenes de las prendas que conforman cada conjunto recomendado deben presentarse side-by-side de forma balanceada, y poseer un enlace directo que permita abrir el modal de detalles de cada prenda si el usuario desea inspeccionarlas.
* **Accesibilidad (WCAG 2.2):**
  - El carrusel de pantalla completa debe ser operable mediante teclado (teclas de flechas izquierda y derecha para cambiar de outfit).
  - Los botones para cambiar de outfit e interactuar con el carrusel deben poseer etiquetas de texto claras (`aria-label="Siguiente Outfit"`, `aria-label="Outfit anterior"`).
  - Se debe notificar explícitamente a los lectores de pantalla sobre el cambio de estado de las prendas seleccionadas a sucias.

---

## ⚙️ Detalles Técnicos y Atributos (Notas para el Desarrollador)
* **Prioridad:** Alta (Cierra el ciclo de interacción de la recomendación y la gestión de disponibilidad).
* **Estimación Sugerida (Story Points):** 3
* **Dependencias:** HU-12 y HU-13 (Requiere el modelo de datos Outfit y el motor de recomendación).
* **Notas Técnicas Adicionales:**
  - Desarrollar la UI del carrusel en un componente de React de cliente.
  - Implementar una Server Action `selectOutfitAction` que maneje la transacción en MongoDB: insertar el documento de `Outfit` y ejecutar un `updateMany` sobre la colección de `Prenda` para cambiar el estado a `Sucio` de las prendas cuyos IDs coincidan con las del conjunto seleccionado.

---

## ⚙️ Reglas Generales del Repositorio (A cumplir por el desarrollador)
* **Puerto del Servidor:** El servidor de desarrollo nunca se levanta en los puertos 3000 o 3001. Debe usarse siempre a partir del puerto 3002 en adelante (ej: `npm run dev -- -p 3002` o `next dev -p 3002`).
* **Nomenclatura de Commits:** Realizar un commit de git por cada cambio realizado utilizando la estructura exacta: `<numeroHU> <tipoDeCambio> <detalles del cambio>` (ej: `HU14 feat: desarrollo del carrusel de outfits a pantalla completa, guardado de selección y cambio de estado a sucio`).
