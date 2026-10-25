# KittySquared — Documento de Diseño

**Fecha:** 2026-10-25  
**Tamaño del trabajo:** Proyecto completo (generador offline de niveles + aplicación web interactiva con audio y tutorial)

---

## 1. Intención y Propósito (El "Por Qué")

**KittySquared** es un juego web de puzzles lógicos inspirado en mecánicas tipo *Star Battle* / *Queens*, adaptado tanto a navegadores móviles como de escritorio. El objetivo es ofrecer una experiencia de deducción pura (sin adivinación ni tanteo a ciegas), envuelta en una estética cálida, táctil y encantadora (*Soft Clay*) protagonizada por gatos vectoriales animados que reaccionan a las jugadas del usuario.

El juego está pensado tanto para jugadores que buscan relajarse sin presión (**modo Chill Out**) como para quienes disfrutan del reto de precisión y puntuación (**modo Classic**), manteniendo siempre exactamente la misma secuencia de 100 niveles pre-generados para todos los jugadores.

---

## 2. Objetivos, No-Objetivos y Anti-Objetivos

### Objetivos (Goals)
- Ofrecer **100 niveles pre-generados de solución única** entre $5 \times 5$ y $9 \times 9$, ordenados por dificultad creciente y garantizados como resolubles mediante reglas de deducción humana.
- Implementar **dos modos de juego** con progreso persistente e independiente en el navegador (`localStorage`): **Chill Out** y **Classic**.
- Incluir un **tutorial interactivo** dividido en conceptos básicos (reglas y deducciones directas) y técnicas intermedias (parejas de líneas/regiones y anticipación de asfixia a 1 paso).
- Soportar **dos esquemas de control** configurables (toque simple/doble o interruptor Cruz/Gato) más arrastre continuo para colocar o quitar cruces cómodamente en móvil y escritorio.
- Presentar una estética **Cálida y Táctil (*Soft Clay*)** con dos diseños propios de gato en SVG (Gato Negro y Gato Blanco con orejas negras) elegibles en ajustes, con expresiones animadas y parpadeo asíncrono aleatorio.
- Acompañar la partida con **efectos de sonido y música ambiental** generados con Web Audio API (con controles independientes de silencio/volumen).

### No-Objetivos (Non-Goals)
- No habrá cuentas de usuario, servidores backend, tablas de clasificación online ni multijugador en esta versión inicial.
- No se generarán puzzles dinámicos en tiempo de ejecución en el navegador del jugador; los 100 puzzles se generan offline y se empaquetan como datos estáticos del juego.
- No se incluirán tableros menores de $5 \times 5$ en los 100 niveles principales (solo en pasos puntuales del tutorial si es necesario) ni mayores de $9 \times 9$.

### Anti-Objetivos (Anti-Goals — Qué haría fracasar el proyecto aunque funcione técnicamente)
- **Tener que adivinar (bifurcación ciega):** un puzzle que obligue al jugador a probar una casilla al azar y avanzar 5 pasos para ver si lleva a contradicción arruinaría especialmente el modo *Classic*.
- **Estética pixel-art o emojis genéricos:** los gatos no pueden ser emojis del sistema (que se pierden sobre ciertos colores como el amarillo) ni perder sus rasgos felinos (orejas, nariz rosa, bigotes) al cambiar de expresión.
- **Animaciones robóticas sincronizadas:** los gatos en reposo nunca deben parpadear ni mover las orejas todos a la vez.

---

## 3. Restricciones (Constraints)

- **Plataforma:** Aplicación web 100% estática (SPA sin backend), jugable en navegadores modernos de escritorio y móviles (iOS/Android) con diseño adaptable centrado.
- **Matemática del tablero:** En un tablero de $N \times N$ con $N$ regiones contiguas y $N$ gatos que no se tocan ni en diagonal, cada solución debe ser **única** para que la validación inmediata del modo *Classic* sea determinista y justa.
- **Accesibilidad visual:** La paleta de hasta 9 colores de regiones debe mantener contraste suficiente tanto entre regiones vecinas como con las cruces y los dos diseños de gato SVG.

---

## 4. Enfoques Técnicos Considerados (Approaches)

### Opción 1 (Elegida): TypeScript + Vite + Preact/React ligero + SVG/CSS + Web Audio API
- **Descripción:** El motor de reglas, el solucionador lógico humano y el generador offline de los 100 puzzles se escriben en TypeScript puro. La interfaz web usa componentes ligeros con renderizado DOM/SVG para el tablero *Soft Clay* y los gatos animados, CSS para transiciones/animaciones con temporizadores desfasados por instancia, y Web Audio API procedural para música y efectos sin activos pesados.
- **Ventajas:** Nitidez vectorial perfecta en cualquier densidad de píxeles, manejo limpio de múltiples pantallas y estados independientes (*Chill Out* vs *Classic*), soporte natural de eventos táctiles/ratón (`pointerdown`, `pointermove`, `pointerup`) y paquete final muy ligero.
- **Contras:** Requiere pipeline de build con Vite.

### Opción 2: TypeScript + Vite en Vanilla DOM sin librería de componentes
- **Ventajas:** Cero dependencias de UI.
- **Contras:** Sincronizar manualmente el estado del tablero, historiales de deshacer, modales de victoria/derrota, tutorial interactivo y ajustes duplica código de infraestructura y dificulta el mantenimiento.

### Opción 3: Motor 2D sobre Canvas/WebGL (PixiJS / Phaser)
- **Ventajas:** Alto rendimiento en juegos de acción.
- **Contras:** Peor ergonomía para maquetación responsiva, menús accesibles y gráficos SVG escalables en un juego de lógica por turnos.

**Razón de la elección:** El usuario seleccionó la **Opción 1** por ofrecer el mejor equilibrio entre calidad visual vectorial (SVG/CSS), reutilización de TypeScript entre el generador offline y el cliente web, y simplicidad para gestionar el estado reactivo del juego.

---

## 5. Especificación Funcional y Decisiones Acordadas

### 5.1. Reglas del Juego
1. El tablero tiene tamaño $N \times N$ casillas ($5 \le N \le 9$ en los 100 niveles), particionado en $N$ regiones de celdas ortogonalmente contiguas, cada una con un color distinto.
2. El objetivo es colocar $N$ gatos en el tablero cumpliendo:
   - Exactamente **1 gato por fila**.
   - Exactamente **1 gato por columna**.
   - Exactamente **1 gato por región de color**.
   - **Sin contacto adyacente:** ningún gato puede tener otro gato en ninguna de sus 8 casillas vecinas (ortogonales ni diagonales).
3. El jugador puede colocar **cruces (`✕`)** como ayuda visual para descartar casillas. Las cruces no afectan a las condiciones de victoria ni provocan penalización.
4. Cada puzzle tiene una **única solución válida**.

### 5.2. Modos de Juego y Progresión
El progreso de **Chill Out** y **Classic** es **independiente** y se guarda automáticamente en `localStorage` (incluyendo el estado del tablero a mitad de partida para poder cerrar y retomar en cualquier momento).

#### Modo Chill Out
- **Colocación libre:** el jugador puede colocar y quitar tantos gatos y cruces como quiera sin límite de fallos.
- **Detección de conflictos:** si dos o más gatos incumplen alguna regla (misma fila, misma columna, misma región o casillas adyacentes), esos gatos se muestran inmediatamente en estado de **conflicto** (borde rojo en la casilla y animación de cara asustada/temblor).
- **Victoria:** se alcanza en el instante en que hay $N$ gatos en el tablero y 0 conflictos. Al completarlo, se avanza al siguiente nivel.

#### Modo Classic
- **Validación inmediata:** cada vez que el jugador coloca un gato en una casilla, se comprueba contra la solución única del puzzle:
  - **Posición correcta:** el gato es válido, reproduce su animación de recién colocado (sonrisa y bote), suma puntos parciales y **queda fijado** en el tablero (no se borra con "Limpiar cruces" ni se puede quitar por error).
  - **Posición incorrecta:** el gato muestra brevemente la animación de fallo/conflicto, se retira (o marca error) y suma **1 fallo** al contador del nivel.
- **Límite de fallos:** el jugador dispone de 3 corazones/vidas por intento. Con 1 o 2 fallos puede seguir jugando; **al tercer fallo** el nivel se da por no superado.
- **Reintento y Puntuación:**
  - Cada gato colocado correctamente otorga **10 puntos parciales**.
  - Al resolver el puzzle completo, los puntos parciales se consolidan en la **puntuación total acumulada** más un **bono de nivel** según los fallos cometidos en ese intento:
    - 0 fallos: $+50$ puntos de bono.
    - 1 fallo: $+30$ puntos de bono.
    - 2 fallos: $+10$ puntos de bono.
  - Si el jugador comete el 3.er fallo, pierde los puntos parciales ganados en ese nivel y puede **reintentar el mismo nivel** desde cero manteniendo intacta su puntuación total acumulada de niveles anteriores.
- **Reinicio de progreso:** desde Ajustes el jugador puede reiniciar su progreso (por modo o global), volviendo al Nivel 1 y dejando la puntuación de *Classic* a 0.

### 5.3. Generador Offline de los 100 Niveles y Solucionador Lógico
Se incluirá un script generador (`npm run generate-puzzles`) que crea y valida los 100 niveles y los guarda en un archivo estático (`src/data/puzzles.json`).

#### Algoritmo de generación
1. Generar una configuración válida de $N$ gatos (1 por fila/columna, sin adyacencia en las 8 casillas vecinas).
2. Generar $N$ regiones conexas (por crecimiento aleatorio ponderado desde semillas) alrededor de esos gatos.
3. Verificar con un solver exacto de backtracking que el tablero tiene **solución única**.
4. Verificar que el tablero es **resoluble paso a paso por el Solucionador Lógico Humano** usando únicamente las reglas permitidas para el tramo de dificultad correspondiente, y medir su puntuación de dificultad según las reglas empleadas.

#### Reglas del Solucionador Lógico Humano
- **Nivel Básico (Reglas 1 y 2):**
  1. *Último hueco libre:* si una fila, columna o región ya sin gato tiene solo 1 casilla disponible, se coloca un gato en ella.
  2. *Descarte directo por gato:* al colocar un gato, se tachan todas las casillas de su fila, su columna, su región y sus 8 vecinas.
- **Nivel Intermedio (Reglas 3 y 4):**
  3. *Intersección de 1 línea y 1 región:* si todas las casillas libres de una región están en la misma fila/columna, se tachan el resto de casillas de esa fila/columna (y viceversa: si una fila/columna solo tiene huecos dentro de una región, se tacha el resto de esa región).
  4. *Vecindad común (alcance de adyacencia):* si todas las casillas libres donde puede ir el gato de una región o línea son adyacentes a una casilla externa $X$, la casilla $X$ se tacha.
- **Nivel Avanzado — 1 o 2 saltos (Reglas 5 y 6):**
  5. *Subconjuntos de $K$ regiones / líneas ($K \in \{2, 3\}$):* si $K$ regiones tienen todas sus casillas libres contenidas en $K$ filas (o columnas), esas $K$ filas quedan reservadas para esas $K$ regiones y se tachan las casillas de cualquier otra región en esas filas (y su dual: si $K$ filas solo tienen casillas libres en $K$ regiones, se tachan las casillas de esas $K$ regiones fuera de esas filas).
  6. *Asfixia a 1 paso (1-step lookahead):* si colocar hipotéticamente un gato en una casilla libre $C$ (aplicando su descarte directo de fila, columna, región y 8 vecinas) dejase a alguna otra fila, columna o región con **0 casillas libres**, entonces $C$ es imposible y se tacha.

#### Distribución de los 100 niveles
| Niveles | Tamaño ($N \times N$) | Cantidad | Reglas requeridas máximas |
|---------|-----------------------|----------|---------------------------|
| 1 – 15 | $5 \times 5$ | 15 | Reglas 1–3 (introductorios) |
| 16 – 40 | $6 \times 6$ | 25 | Reglas 1–4 |
| 41 – 65 | $7 \times 7$ | 25 | Reglas 1–5 |
| 66 – 85 | $8 \times 8$ | 20 | Reglas 1–6 |
| 86 – 100 | $9 \times 9$ | 15 | Reglas 1–6 (mayor densidad de pasos 5 y 6) |

### 5.4. Tutorial Interactivo
Accesible desde la Pantalla de Inicio (y sugerido automáticamente si el jugador entra por primera vez en el Nivel 1):
- **Parte 1 (Básico):** explica con mini-tableros guiados las 3 reglas de colocación (fila/columna, región, no tocarse en diagonal) y las deducciones inmediatas (región de 1 casilla, región contenida en una fila).
- **Parte 2 (Técnicas avanzadas):** explica de forma visual la regla de **Parejas de regiones/filas** y la regla de **Asfixia de una región vecina (1 salto)**.

### 5.5. Interfaz, Controles y Ergonomía
- **Esquemas de control (seleccionables en Ajustes):**
  1. **Botón doble (Interruptor Cruz / Gato):** barra inferior con selector `✕ Cruz | 🐱 Gato`. Un toque en una casilla aplica o quita el elemento seleccionado.
  2. **Toque simple / doble:** 1 toque en casilla vacía pone `✕`; otro toque (o doble toque) pone `🐱`; un toque más limpia la casilla. En este modo el interruptor inferior se oculta para despejar la pantalla.
- **Arrastre continuo de cruces:** deslizar el dedo o el ratón manteniendo pulsado permite pintar o borrar cruces en múltiples casillas seguidas (nunca coloca gatos por arrastre accidental).
- **Acciones de apoyo en partida:**
  - **Deshacer (`↩`):** revierte el último cambio de cruces o gatos (en *Classic* no revierte un fallo ya contabilizado).
  - **Limpiar cruces (`🧹`):** limpia todas las cruces manuales (y gatos no fijados en *Chill Out*) dejando intactos los gatos ya validados en *Classic*.

### 5.6. Estética, Gatos SVG y Audio
- **Estilo Visual:** *Soft Clay* (Cálido y Táctil). Fondo crema (`#FFFBF2`), tablero sobre bandeja beige cálida (`#EFE6D5`), casillas redondeadas con ligero bisel inferior y paleta de hasta 9 colores luminosos bien diferenciados.
- **Diseños de Gato SVG (elegibles en Ajustes):**
  - **Opción 1: Gatito Negro** con borde exterior blanco fino (`stroke`), interior de orejas rosa, nariz triangular rosa, boca en `"ω"`, 4 bigotes blancos laterales y ojos grandes expresivos.
  - **Opción 2: Gatito Blanco** con borde exterior oscuro definido, manchas negras en las puntas de las orejas, nariz rosa, boca en `"ω"`, 4 bigotes oscuros laterales y ojos grandes brillantes.
  - **Consistencia de rasgos:** en **todos** los estados animados se conservan las orejas, la nariz rosa y los 4 bigotes laterales; solo mutan los ojos, la boca y los mofletes:
    - *En reposo (Idle):* ojos abiertos con parpadeo y ligero movimiento de orejas disparados por **temporizadores aleatorios independientes por cada gato** (ej. cada $3.5\text{ s} - 8.5\text{ s}$ con desfase inicial aleatorio) para que nunca estén sincronizados.
    - *Recién colocado:* bote elástico (`scale`) y ojos arqueados sonrientes (`^ ^`) durante $\sim 1\text{ s}$ antes de pasar a reposo.
    - *En conflicto / Fallo:* ojos en `> <`, boca en zigzag y temblor horizontal, acompañado de anillo rojo en la casilla.
    - *Victoria:* ojos felices (`^ ^`), mofletes sonrojados, sonrisa abierta bajo el hocico `"ω"` y salto de celebración.
- **Sonido y Música:** sintetizador ligero basado en Web Audio API con melodía ambiental suave en bucle y efectos para: colocar/quitar cruz, colocar gato (maullido tonal alegre), conflicto/error y victoria de nivel. Botones de silencio independientes para Música y Efectos en Ajustes.

---

## 6. Qué Queda a Criterio del Constructor (Left to the Builder)

- Organización interna de carpetas en `src/`, estructura exacta del estado en Preact/React y formato JSON detallado de `puzzles.json`.
- Valores hexadecimales exactos de los 9 colores de regiones (respetando la estética *Soft Clay* aprobada y alto contraste mutuo).
- Frecuencias, envolventes ADSR y notas concretas del sintetizador Web Audio API.
- Diseño exacto de los3-4 tableros pequeños de ejemplo dentro del tutorial interactivo.
- Persistencia en `localStorage` (nombres de claves y migración básica de esquema).
