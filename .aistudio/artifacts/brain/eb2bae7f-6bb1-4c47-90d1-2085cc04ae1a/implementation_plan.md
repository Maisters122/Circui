# Arquitectura Gráfica de Marcas de Derrape Hiperrealistas (F1 Slicks Rubbering & Custom Shader)

Plan de ingeniería gráfica de alto nivel para sustituir las cintas planas poligonales actuales por un sistema hiperrealista de depósito de goma para neumáticos de Fórmula 1, utilizando un shader personalizado con oscurecimiento multiplicativo, estriado dinámico de hombros de contacto, bordes con dispersión difusa y persistencia progresiva por vueltas sin penalización de rendimiento.

---

## Decisiones Críticas y Preferencias del Usuario

> [!IMPORTANT]
> A partir de las respuestas confirmadas en la fase de clarificación, se han fijado las siguientes especificaciones técnicas para la ejecución:

- **Estilo Visual & Textura**: Acabado de slicks de F1 con bandas longitudinales de presión (hombros exteriores oscurecidos por caída/camber y deformación lateral), estriado micro-abrasivo de goma fundida y bordes difusos que se funden orgánicamente con los poros del asfalto.
- **Técnica de Renderizado (Shader Custom)**: Sustitución de `MeshBasicMaterial` por un `ShaderMaterial` especializado con mezcla multiplicativa/sustractiva que tiñe y oscurece el asfalto (evitando la apariencia lechosa/grisácea de plástico), grano procedural de árido y sutil brillo especular de goma curada en ángulos rasantes.
- **Persistencia & Acumulación**: Búfer anular optimizado de alta capacidad (6.000 quads / ~36.000 vértices, < 450 KB en VRAM) que preserva las huellas a lo largo de las vueltas, con decaimiento térmico y atenuación progresiva en frenada y curva.

---

## 1. Visión General y Concepto Central

### El Problema de la Implementación Actual
Tal y como se observa en la captura del usuario, las marcas actuales consisten en quads geométricos planos sin mapa de texturas ni coordenadas UV (`MeshBasicMaterial` con color estático `rgb(0.05, 0.05, 0.06)` y `NormalBlending`). Al mezclarse linealmente sobre el asfalto marrón, la GPU promedia los colores generando una **cinta grisácea descolorida de aspecto plástico o de juguete**, con bordes cortados en seco como cinta aislante y sin textura de neumático. Además, la capacidad de 1.200 puntos sobreescribe las huellas en apenas 5 segundos.

### La Solución Hiperrealista
Un sistema de huellas de nivel simulación (Gran Turismo / Assetto Corsa) compuesto por:
1. **Generación Geométrica Continua 4-Ruedas con UVs Tangenciales**: Orientación perpendicular real a la trayectoria de cada rueda (evitando torsiones en trompos), con coordenadas UV normalizadas ($u \in [0, 1]$ a lo ancho de la banda de rodadura, $v$ acumulado a lo largo del deslizamiento).
2. **Shader Personalizado de Depósito de Goma (`F1SkidShader`)**:
   - **Perfil de Presión de Contacto**: Doble cresta de fricción en los hombros del neumático (más oscura donde la goma sufre máxima carga lateral).
   - **Dispersión Difusa en Bordes**: Atenuación suave (`smoothstep`) hacia los extremos para fusionar la goma con los granos del asfalto.
   - **Oscurecimiento Multiplicativo Real**: La goma penetra y mancha la superficie existente en lugar de pintar una capa gris traslúcida.
   - **Micro-Estrías y Rugosidad**: Detalle procedural de alta frecuencia simulando desgarro de compuestos blandos (*soft compound graining*).
3. **Persistencia por Vueltas con Curado Térmico**:
   - Expansión de capacidad a 6.000 puntos en un único `BufferGeometry` con `drawRange` dinámico.
   - Envejecimiento progresivo: Las marcas frescas son oscuras y brillantes; con el paso de las vueltas se asientan y forman la línea de carrera engomada (*racing rubber line*).

---

## 2. Experiencia Visual y Diseño

### Apariencia en Pista
- **Curva al Límite / Drift**: Al entrar en derrape lateral, las ruedas exteriores (sometidas a transferencia de peso) depositan dos bandas intensas de negro carbón con estriado nítido y polvo de goma en el exterior.
- **Bloqueo de Frenos (Lockup)**: Mancha plana y densa que comienza súbitamente con bordes estriados longitudinales y se va atenuando al recuperar rotación la rueda.
- **Engomado Progresivo**: Al pasar vuelta tras vuelta por la misma trazada, las huellas anteriores permanecen como referencias visuales de frenada y vértice de curva.

### Tokens de Color y Composición
- **Color Núcleo de Goma**: `#0A0908` (carbón profundo con tinte asfáltico caliente).
- **Hombros de Fricción**: Modulación del factor de oscurecimiento hasta un 88% en el núcleo y hombros.
- **Grano de Árido**: Perturbación matemática procedural de alta frecuencia basada en coordenadas mundiales para sincronizar el grano de la goma con los poros de la pista.

---

## 3. Decisiones Técnicas y Compromisos

| Decisión | Enfoque Seleccionado | Razón Técnica | Alternativas Descartadas |
| :--- | :--- | :--- | :--- |
| **Material de Renderizado** | `ShaderMaterial` GLSL a medida con `polygonOffset` calibrado | Permite perfil estriado, bordes difusos y oscurecimiento multiplicativo sin texturas externas pesadas | `MeshBasicMaterial` (genera el aspecto grisáceo actual) o texturas PNG estáticas (falta de detalle en zoom) |
| **Generación de Cinta Geométrica** | Quads continuos con vector normal a la velocidad tangencial de la rueda | Garantiza continuidad perfecta sin costuras ni picos en rotaciones extremas del monoplaza | Orientación por el vector `forward` del coche (se deforma y retuerce en trompos) |
| **Memoria y GPU** | Búfer estático de vértices (`BufferGeometry`) con `updateRange` acotado | Cero asignaciones en el bucle de juego (Zero GC), 1 sola Draw Call para las 4 ruedas | Creación de mallas dinámicas o decals individuales (alta sobrecarga de Draw Calls y memoria) |
| **Capacidad de Huellas** | Anillo circular de 6.000 puntos (~36.000 vértices, ~430 KB VRAM) | Permite que las marcas duren vueltas completas sin caída de FPS en dispositivos móviles o 120 Hz | 1.200 puntos actuales (desaparecen en 5s) |

---

## 4. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────┐
│                   VehiclePhysics                       │
│    (wheelSlipRatios[4], isDrifting, wheelPositions[4]) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             ParticleSystem / SkidMarkEngine            │
│  - Cálculo de tangente de desplazamiento por rueda     │
│  - Ancho dinámico con deformación y camber             │
│  - Asignación de UVs normalizadas (u: perfil, v: dist) │
│  - Timestamp y factor de agarre en canales de atributo │
└───────────────────────────┬────────────────────────────┘
                            │ (BufferAttribute UpdateRange)
                            ▼
┌────────────────────────────────────────────────────────┐
│              F1SkidShader (GLSL Custom)                │
│                                                        │
│  Vertex Shader:                                        │
│   - Proyección con polygonOffset (cero z-fighting)     │
│   - Paso de UVs, Intensidad de deslizamiento y Edad    │
│                                                        │
│  Fragment Shader:                                      │
│   - Perfil de hombros: smoothstep + crestas cos(u)     │
│   - Estriado longitudinal: micro-ruido procedural      │
│   - Atenuación difusa de bordes: smoothstep en bordes  │
│   - Mezcla multiplicativa sobre el fondo del asfalto   │
└────────────────────────────────────────────────────────┘
```

---

## 5. Fases de Ejecución

1. **Diseño del Shader `F1SkidShader`**:
   - Implementar el material GLSL con uniforms de tiempo, parámetros de textura de goma, brillo y factor de envejecimiento.
   - Configuración precisa de `polygonOffset` y profundidad para eliminar cualquier parpadeo (*Z-fighting*) a cualquier distancia de cámara.
2. **Reingeniería del Generador Geométrico en `ParticleSystem.ts`**:
   - Incorporar atributo de coordenadas `uv` y atributos de vértice optimizados (`position`, `uv`, `skidData`).
   - Algoritmo de cinta tangencial por rueda: cálculo perpendicular a la trayectoria real de avance del neumático para evitar distorsiones.
   - Ampliación del búfer anular a 6.000 quads para persistencia durante la carrera.
3. **Calibración de Físicas y Validación Visual**:
   - Mapeo del ancho de neumático delantero (0.305m) y trasero (0.405m) fieles a especificaciones F1.
   - Ajuste de respuesta dinámica según compuesto y frenada.
   - Comprobación de frametime estable (60/120 FPS) en desktop y móvil.
