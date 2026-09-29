# Protocolo de evolución automática

## Objetivo por ejecución
Crear **10 versiones consecutivas** desde la versión principal actual.

Ejemplo: si `VERSION.json` indica 10, producir V11 → V20. La V20 será la nueva principal.

## Reglas
1. Cada versión debe introducir al menos una mejora funcional o de diseño perceptible.
2. Distribuir las 10 iteraciones entre sistemas diferentes.
3. Ejecutar comprobaciones de sintaxis después de cada cambio relevante.
4. Corregir regresiones antes de avanzar a la siguiente versión.
5. No acumular sistemas inconexos: integrar y equilibrar lo existente.
6. Monetización: anuncios recompensados opcionales; evitar interrupciones durante la partida.
7. Actualizar `VERSION.json` y `CHANGELOG.md` en cada versión.
8. Crear un commit por versión con formato `vNN: resumen`.
9. La décima versión de la pasada debe ser sensiblemente más completa que la primera.
10. Al finalizar, resumir las 10 versiones y dejar limpia la rama principal.

## Orden recomendado rotatorio
- Vx1 game feel / controles
- Vx2 patrones y dificultad
- Vx3 economía/progresión
- Vx4 power-ups
- Vx5 misiones/cofres
- Vx6 mundos/contenido
- Vx7 onboarding/UX móvil
- Vx8 retención/eventos/ranking
- Vx9 equilibrio, rendimiento y correcciones
- Vx0 integración amplia + pulido de la pasada
