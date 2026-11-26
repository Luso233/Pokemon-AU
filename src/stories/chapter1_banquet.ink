VAR team_mode = "daily"
VAR mixed_role = "physical"
VAR assassin_plan = "sabotage"

-> salon

=== salon ===
Las lámparas de cristal del Salón de Estado de Wyndon parpadean dos veces... y se apagan por completo. # bg: banquet-hall # speaker: Narrador # mood: tense
Un humo violeta se filtra desde los ductos de ventilación mientras los invitados diplomáticos de Kalos y Paldea corren hacia las salidas. # bg: banquet-hall # speaker: Narrador # mood: tense
De entre las sombras emerge un mercenario con el emblema tachado de la antigua guardia. No viene por medallas: viene en formato Combate Doble a vida o muerte. # bg: banquet-hall # speaker: Narrador # pokemon: smeargle # side: right # mood: serious
"Órdenes directas de arriba, Príncipe. Sin rutas de hierba, sin curaciones gratis, niveles bloqueados al 100. Hoy cae la Corona." # bg: banquet-hall # speaker: Sicario de la Corte # pokemon: smeargle # side: right # mood: smug
Tu comunicador parpadea con un aviso urgente de seguridad. Solo tienes dos segundos antes de que cierren las puertas blindadas. # bg: banquet-hall # speaker: Servicio Secreto # side: left # mood: serious

* [Protocolo Civil: Resistir con tu Equipo de Vida Diaria (Arcanine, Gardevoir, Milotic, Corviknight)]
    ~ team_mode = "daily"
    "No hay tiempo de abrir la armería. ¡Arcanine, Gardevoir, formación de protección!" # bg: banquet-hall # speaker: Príncipe Heredero # pokemon: arcanine # side: left # mood: fierce
    -> elegir_set_mixto
* [Código Corona: Activar teletransporte y desplegar tu Equipo de Combate (Zacian, Dragapult, Tyranitar, Gallade)]
    ~ team_mode = "combat"
    "¡Gardevoir, teletranspórtanos el maletín de guerra! Si quieren sangre real, conocerán a Zacian." # bg: banquet-hall # speaker: Príncipe Heredero # pokemon: zacian-crowned # side: left # mood: fierce
    -> elegir_set_mixto

=== elegir_set_mixto ===
{ team_mode == "combat": Dragapult sobrevuela el techo abovedado esperando tu orden táctica. Puede operar como asesino físico o como cañón especial con Gafas Elegidas. # bg: banquet-hall # speaker: Narrador # pokemon: dragapult # side: left # mood: serious }
{ team_mode == "daily": Arcanine ruge frente a ti. Puedes ordenarle presionar físicamente con Envite Ígneo o mantener distancia con Onda Ígnea especial y Alarido. # bg: banquet-hall # speaker: Narrador # pokemon: arcanine # side: left # mood: serious }

* [Enfoque Físico (Presión directa y daño de contacto)]
    ~ mixed_role = "physical"
    "Atacaremos de frente antes de que puedan montar sus trampas." # bg: banquet-hall # speaker: Príncipe Heredero # side: left # mood: confident
    -> confrontacion_politica
* [Enfoque Especial (Control de área y daño a distancia)]
    ~ mixed_role = "special"
    "Mantengan la distancia. Castiguemos sus defensas con ataques especiales en área." # bg: banquet-hall # speaker: Príncipe Heredero # side: left # mood: confident
    -> confrontacion_politica

=== confrontacion_politica ===
El sicario sonríe bajo su máscara y prepara un segundo cinturón de Poké Balls de élite (≤ 400 BST con sets sucios de Showdown). # bg: banquet-hall # speaker: Sicario de la Corte # pokemon: sableye # side: right # mood: smug
"¿Sabes qué es lo peor de depender de Pokémon legendarios y raros, muchacho? Que somos baratos... y sucios." # bg: banquet-hall # speaker: Sicario de la Corte # pokemon: sableye # side: right # mood: smug

* [Guardar silencio y leer su formación (Rival: Escuadrón de Sabotaje — Smeargle, Sableye, Cottonee, Clefairy)]
    ~ assassin_plan = "sabotage"
    El mercenario despliega su táctica estándar de control: Espora, Señuelo, Bromista y Viento Afín. # bg: banquet-hall # speaker: Narrador # pokemon: cottonee # side: right # mood: tense
    -> fin_escena
* [Acusarlo de trabajar para Tizonio y Dargo (Rival: Protocolo Espejo — Ditto Impostor + Smeargle + Sableye + Cottonee)]
    ~ assassin_plan = "mirror"
    "¡Maldición, sabes demasiado! ¡Plan B: Ditto con Pañuelo Elegido para usar tu propio poder contra ti!" # bg: banquet-hall # speaker: Sicario de la Corte # pokemon: ditto # side: right # mood: angry
    -> fin_escena

=== fin_escena ===
Las puertas blindadas se sellan con un estruendo metálico. Combate Doble 2v2 inicializado mediante @pkmn/sim. # bg: banquet-hall # speaker: Sistema Táctico # side: left # mood: serious
-> END
