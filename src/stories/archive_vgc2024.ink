VAR selected_player = "luca"
VAR rival_plan = "game1"

-> archivo_real

=== archivo_real ===
Sala de Simulación Táctica del Archivo Real de Galar. Pantallas holográficas reconstruyen el estadio del Campeonato Mundial 2024 en Honolulu. # bg: vgc-worlds-stage # speaker: Narrador # char: champion # side: right # pokemon: calyrexice # mood: confident
"Si quieres dominar combates dobles bajo presión real, Alteza, estudia la cumbre de la era Teracristalización: la Final Mundial entre Luca Ceribelli (Italia) y Yuta Ishigaki (Japón)." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: miraidon # mood: confident
"Reglas oficiales VGC 2024 Regulación G: Nivel 50, Bring 6 Pick 4 y Open Teamsheets completos. Primero, ¿en los zapatos de qué finalista quieres jugar esta simulación?" # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: ironvaliant # mood: serious

* [Jugar como Luca Ceribelli — Equipo de Miraidon (Whimsicott, Urshifu-R, Ogerpon-H, Iron Hands, Farigiraf)]
    ~ selected_player = "luca"
    "Excelente elección. Tomarás el control del Campeón Mundial: presión de Campo Eléctrico con Miraidon Choice Specs, Viento Afín de Whimsicott y control de Espacio Raro con Farigiraf." # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: miraidon # mood: confident
    -> elegir_plan_yuta
* [Jugar como Yuta Ishigaki — Equipo de Calyrex-Ice (Urshifu-R, Pelipper, Amoonguss, Iron Valiant, Landorus)]
    ~ selected_player = "yuta"
    "Interesante desafío. Piloteas el núcleo japonés de Calyrex Jinete Glacial: apertura explosiva con Iron Valiant + Landorus Scarf, soporte de Pelipper/Amoonguss y remate bajo Espacio Raro." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: calyrexice # mood: confident
    -> elegir_plan_luca

=== elegir_plan_yuta ===
"Ahora elige qué plan de la final quieres que ejecute la IA de Yuta Ishigaki contra tu Miraidon:" # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: pelipper # mood: serious

* [Plan Juego 1: Yuta abre Iron Valiant + Landorus (Pelipper + Calyrex-Ice en retaguardia)]
    ~ rival_plan = "game1"
    "Prepárate para Choque Anímico sobre Miraidon, Simún de Arena, Lluvia con Pelipper y Espacio Raro de Calyrex-Ice." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: landorus # mood: confident
    -> cierre_vgc
* [Plan Juego 2: Yuta abre Iron Valiant + Landorus (Amoonguss + Calyrex-Ice en retaguardia)]
    ~ rival_plan = "game2"
    "Cuidado con Polvo Ira y Espora de Amoonguss protegiendo el Espacio Raro de Calyrex-Ice. Ogerpon y el Campo Eléctrico serán decisivos." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: amoonguss # mood: serious
    -> cierre_vgc

=== elegir_plan_luca ===
"Ahora elige qué configuración de la final ejecutará la IA de Luca Ceribelli frente a tu Calyrex-Ice:" # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: whimsicott # mood: serious

* [Plan Juego 1: Luca abre Whimsicott + Miraidon (Iron Hands + Farigiraf en retaguardia)]
    ~ rival_plan = "game1"
    "Luca buscará Viento Afín y Brillo Mágico inmediato en Turno 1, guardando a Iron Hands (Sorpresa) y Farigiraf (Cola Armadura) para frenar tu Espacio Raro." # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: farigiraf # mood: confident
    -> cierre_vgc
* [Plan Juego 2: Luca abre Whimsicott + Miraidon (Urshifu-Fluido + Ogerpon-Horno en retaguardia)]
    ~ rival_plan = "game2"
    "Modo hiper-ofensivo de Luca: presión de Miraidon + Whimsicott seguida por Ogerpon-Horno (Señuelo / Garrote Liana) y Urshifu-Fluido con Banda Focus." # bg: vgc-worlds-stage # speaker: La Campeona # char: prince # side: left # pokemon: ogerponhearthflame # mood: serious
    -> cierre_vgc

=== cierre_vgc ===
Simulación oficial gen9vgc2024regg cargada (Nivel 50 · Open Teamsheets activos). Revisa el Teamsheet y selecciona 4 de tus 6 Pokémon en el Team Preview interactivo. # bg: vgc-worlds-stage # speaker: Sistema Táctico # char: prince # side: left # pokemon: miraidon # mood: confident
-> END
