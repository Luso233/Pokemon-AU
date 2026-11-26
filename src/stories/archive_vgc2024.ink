VAR yuta_plan = "game1"

-> archivo_real

=== archivo_real ===
Sala de Simulación Táctica del Archivo Real de Galar. Pantallas holográficas reconstruyen el estadio del Campeonato Mundial 2024 en Honolulu. # bg: vgc-worlds-stage # speaker: Narrador # char: champion # side: right # pokemon: calyrexice # mood: confident
"Si quieres dominar combates dobles bajo presión real, Alteza, estudia la cumbre de la era Teracristalización: la Final Mundial entre Luca Ceribelli y Yuta Ishigaki." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: ironvaliant # mood: confident
"Tomarás el mando del equipo de Luca — Miraidon, Whimsicott, Urshifu-Fluido, Ogerpon-Horno, Ferropalmas y Farigiraf — con Open Teamsheets completos, igual que en el escenario oficial." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: miraidon # mood: calm
"Reglas oficiales VGC 2024 Regulación G: Nivel 50, Bring 6 Pick 4. Antes de elegir tus cuatro Pokémon, inspecciona las hojas de equipo (Open Teamsheet) y elige qué plan de Yuta quieres simular:" # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: pelipper # mood: serious

* [Simulación Juego 1: Yuta abre con Iron Valiant + Landorus (Pelipper + Calyrex-Ice en retaguardia)]
    ~ yuta_plan = "game1"
    "Perfecto. Prepárate para su presión de Choque Anímico, Lluvia con Pelipper y Espacio Raro de Calyrex Jinete Glacial." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: landorus # mood: confident
    -> cierre_vgc
* [Simulación Juego 2: Yuta abre con Iron Valiant + Landorus (Amoonguss + Calyrex-Ice en retaguardia)]
    ~ yuta_plan = "game2"
    "Cuidado con Polvo Ira y Espora de Amoonguss protegiendo el Espacio Raro de Calyrex-Ice. Ogerpon y el Campo Eléctrico de Miraidon serán decisivos." # bg: vgc-worlds-stage # speaker: La Campeona # char: champion # side: right # pokemon: amoonguss # mood: serious
    -> cierre_vgc

=== cierre_vgc ===
Simulación oficial gen9vgc2024regg cargada (Nivel 50 · Open Teamsheets activos). Selecciona 4 de tus 6 Pokémon en el Team Preview interactivo. # bg: vgc-worlds-stage # speaker: Sistema Táctico # char: prince # side: left # pokemon: miraidon # mood: confident
-> END
