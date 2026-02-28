# MANUAL TÉCNICO: Ruleta de Asignación Académica

## 1. Arquitectura del Sistema

Este proyecto implementa una arquitectura moderna de **Single Page Application (SPA)** desacoplada, utilizando **Angular 19** para el frontend y **Node.js con Express** para el backend, comunicándose a través de una API RESTful. La persistencia de datos se maneja con **MariaDB**.

### Componentes Principales:

- **Frontend (Cliente):**
  - **Framework:** Angular 19.
  - **Responsabilidad:** Interfaz de usuario, gestión de estado local, validaciones en cliente y consumo de API.
  - **Características Clave:** Uso de **Standalone Components**, **Signals** para reactividad granular y **Zoneless** (a futuro/opcional) para mejor rendimiento.
- **Backend (Servidor):**
  - **Runtime:** Node.js.
  - **Framework:** Express.js.
  - **Responsabilidad:** Lógica de negocio, autenticación, autorización, interacción con la base de datos y ejecución del algoritmo de sorteo auditable.
  - **API:** RESTful endpoints que devuelven JSON.
- **Base de Datos:**
  - **Motor:** MariaDB (vía XAMPP).
  - **Responsabilidad:** Almacenamiento persistente, integridad referencial y restricciones de unicidad crítica para evitar fraudes.

---

## 2. Justificación de Angular 19 Signals

La elección de **Angular 19** y específicamente su primitiva de reactividad **Signals** es fundamental para la tesis por las siguientes razones:

1.  **Reactividad Granular:** A diferencia de `Zone.js` que re-evalúa todo el árbol de componentes ante cualquier evento, los Signals permiten que solo los componentes que dependen de un dato específico se actualicen. Esto es crucial para la "Ruleta", donde la actualización en tiempo real de las asignaciones debe ser fluida y eficiente, especialmente si se visualiza el proceso de sorteo.
2.  **Gestión de Estado Simplificada:** Signals elimina la necesidad de librerías complejas de gestión de estado (como NgRx) para casos de uso medianos, reduciendo la curva de aprendizaje y el boilerplate del código. Permite derivar estados (ej: `computed()`) de forma declarativa (por ejemplo, calcular cuántos alumnos quedan por asignar automáticamente).
3.  **Futuro del Framework:** Angular se está moviendo hacia un modelo "Zoneless". Usar Signals prepara el proyecto para el futuro, demostrando que la tesis está construida con tecnología de vanguardia y no con patrones obsoletos.
4.  **Auditabilidad y Traza:** El flujo de datos con Signals es unidireccional y predecible, lo que facilita depurar cómo y cuándo cambió el estado de una asignación, aportando a la transparencia del sistema.

---

## 3. Algoritmo de Sorteo: Fisher-Yates Shuffle

Para garantizar que la asignación de alumnos a profesores sea **matemáticamente aleatoria, justa y no manipulable**, utilizaremos el algoritmo **Fisher-Yates Shuffle** (también conocido como Knuth Shuffle).

### ¿Por qué Fisher-Yates y no `Math.random()` simple?

Un enfoque ingenuo de "ordenar por random" (`array.sort(() => Math.random() - 0.5)`) es **incorrecto** y **sesgado**. No produce una distribución uniforme de todas las permutaciones posibles.

### Implementación del Algoritmo

El algoritmo funciona recorriendo el arreglo desde el último elemento hasta el primero:

1.  Se toma el elemento actual (índice `i`).
2.  Se elige un índice aleatorio `j` entre `0` y `i`.
3.  Se intercambian los elementos en `i` y `j`.

Esto asegura que cada permutación tenga exactamente la misma probabilidad de ocurrir, cumpliendo con el requisito de **auditoría** y **transparencia**.

### Proceso de Asignación Balanceada

1.  **Obtener Listas:** Se recuperan todos los `Alumnos` pendientes y los `Profesores` disponibles.
2.  **Mezcla (Shuffle):** Se aplica Fisher-Yates a la lista de `Alumnos`. Esto garantiza que el orden de asignación sea aleatorio.
3.  **Distribución Cíclica (Round Robin):**
    - Iteramos sobre la lista mezclada de alumnos.
    - Asignamos cada alumno al siguiente profesor disponible en la lista de profesores.
    - Si llegamos al final de la lista de profesores, volvemos al inicio.

    _Ejemplo:_ Si hay 3 profesores (A, B, C) y 10 alumnos aleatorizados:
    - Alumno 1 -> Profe A
    - Alumno 2 -> Profe B
    - Alumno 3 -> Profe C
    - Alumno 4 -> Profe A
    - ...

    Esto garantiza matemáticamente el balanceo de carga (diferencia máxima de 1 alumno entre profesores).

---

## 4. Garantía Anti-Fraude (Base de Datos)

Para cumplir el requisito crítico de que "un alumno no puede estar asignado a dos eventos simultáneos", no confiamos solo en la validación del código (backend/frontend). Implementamos una restricción física en la base de datos:

```sql
ALTER TABLE asignaciones
ADD CONSTRAINT uk_alumno_periodo_evento
UNIQUE (alumno_id, periodo_id, tipo_evento_id);
```

Esta restricción (`UNIQUE INDEX`) asegura que el motor de base de datos rechace cualquier intento de insertar una segunda asignación para el mismo alumno en el mismo contexto, haciendo el sistema robusto a errores de programación o intentos de manipulación directa.
