# Lane Rush

Juego móvil arcade de partidas rápidas (30–90 s) orientado a rejugabilidad y monetización no intrusiva.

## Estado
Esta carpeta representa **Lane Rush V10**, la primera versión persistente en código del diseño iterativo previo. Las siguientes mejoras deben continuar como V11, V12, etc.; no reiniciar el proyecto.

## Ejecutar
No necesita instalación ni dependencias:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080` desde un navegador. En móvil puede instalarse como PWA.

## Sistemas actuales
- 3 carriles, swipe izquierda/derecha.
- Obstáculos y patrones variables.
- Monedas, combo, récord y dificultad dinámica.
- Power-ups: shield, magnet, slow.
- Mundos por avance.
- Skins, misiones, cofres, temporada, recompensa diaria.
- Persistencia local.
- Hooks de anuncios recompensados simulados (revivir/x2), sin intersticiales forzados.

## Regla de evolución
Cada versión debe ser una iteración funcional real sobre la anterior. Priorizar gameplay/game feel, obstáculos/patrones, progresión, mundos, skins, misiones, economía, power-ups, cofres, ranking/eventos, retención, onboarding, equilibrio, UX móvil y monetización no intrusiva. Evitar cambios cosméticos aislados.

Consulta `docs/AUTOMATION.md` para el protocolo de iteración automática.
