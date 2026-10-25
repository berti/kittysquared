# KittySquared - Juego web de puzzles

Ésta es la especificación inicial de KittySquared, un juego de puzzles para la web, que se adapta a navegadores móviles y de escritorio. Aquí se describen las pricipales ideas del juego, como por ejemplo las reglas, que tenemos claras antes de empezar a investigar más en profundidad.

## Reglas

En KittySquared los jugadores progresan a través de una serie de puzzles a resolver.

Cada puzzle es un tablero de NxN casillas. El tablero está particionado en N áreas, cada una con un color distinto. Las áreas están compuestas por celdas contiguas del mismo color.

El objetivo del juego es colocar N gatos en el tablero, siguiendo estas reglas:

- No puede haber más de un gato en cada área
- No puede haber más de un gato en cada fila y en cada columna
- Un gato no debe de tener otro gato en ninguna de sus 8 casillas adyacentes

El jugador también puede colocar cruces en las casillas del tablero. Estas cruces sirven de apoyo para visualizar aquellas casillas que considere que no pueden tener un gato. Estas casillas no cuentan de ningún modo para las reglas.

Si el jugador consigue colocar los N gatos correctamente, resuelve el puzzle y puede avanzar al siguiente puzzle.

## Generación de puzzles

Los puzzles se deben generar de forma automática, siguiendo las reglas de arriba, más algunas que permitan crear puzzles desafiantes pero resolubles sin excesivas dificultades.

Los puzzles generados se guardarán y se incluirán como datos del juego, de manera que cualquier jugador siempre verá la misma secuencia de puzzles cuando juegue.

Algunas ideas para que los puzzles sean accesibles:

- Tener una única solución. No es 100% necesario, pero ayuda a reducir la frustración y el espacio de soluciones a explorar. Eso sí, si hay múltiples soluciones, el juego debe aceptarlas todas.
- Tener algunas áreas que sean fáciles de deducir. Por ejemplo:
  - Un área de una sola casilla tiene que tener forzosamente un gato.
  - Un área que esté completamente en una fila (o columna) implica que las casillas de otros áreas que estén la misma fila (o columna) no pueden tener gatos.
  - Después de colocar las cruces correspondientes de un gato, el espacio debe reducirse de manera que la posición de algún gato se pueda deducir con estas reglas (u otras que se encuentren como válidas).
- No requerir de demasiados "saltos en el futuro" para decidir si una potencial posición de un gato es buena o no.

## Modos de juego

Inicialmente se ofrecerán dos modos de juego:

- Chill out. El jugador no tiene penalizaciones a la hora de colocar gatos. Cuando dos gatos están en conflicto, por ejemplo están en la misma fila, estos gatos aparecen como resaltados. Aunque los N gatos estén colocados, el nivel no se puede dar por completado hasta que estos gatos estén colocados siguiendo las reglas del juego.

- Classic. En el momento que el jugador coloca un gato, el juego comprueba si está en una posición correcta o no, desde el punto de vista de resolución de ese puzzle en particular. Al jugador se le permiten hasta 3 fallos colocando un gato. Si vuelve a fallar, no resuelve el puzzle. Además, en este modo cada gato bien colocado y cada puzzle resuelto dan puntos. En este modo es especialmente importante que los puzzles sean resolubles sin excesivas dificultades.

## Interfaz

El juego se debe poder jugar fácilmente tanto con el ratón de un navegador de escritorio, como con el dedo en un móvil.

A la hora de colocar los gatos y las cruces se plantean dos modos distintos, que el usuario podrá elegir en la configuración del juego:

- Un click para colocar una cruz, y dos clicks para tocar un gato
- Botón doble que permita elegir si un click colocará una cruz o un gato

 ## Estética

El juego deberá seguir una estética agradable y moderna, no tipo pixel art, con colores luminosos. Durante la partida el juego deberá mostrar animaciones que ayuden al jugador a entender lo que está pasando, y que le diviertan y animen a seguir jugando. Los efectos de sonido y la música también deben acompañar.
