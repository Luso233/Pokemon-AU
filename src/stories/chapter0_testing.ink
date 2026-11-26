VAR arceus_build = "physical"
VAR player_companion = "none"
VAR rival_stance = "ceremonial"

-> inicio

=== inicio ===
El agua del Estanque Real de Wyndon refleja las banderas doradas de la Corona de Galar. # bg: royal-pond # speaker: Narrador # mood: calm
Hoy no es una ceremonia cualquiera: la corte entera observa el primer juicio público del Príncipe Heredero. # bg: royal-pond # speaker: Narrador # mood: calm
Lord Vane, emisario de la facción de Tizonio y Dargo, avanza con una sonrisa burlona sosteniendo seis Poké Balls idénticas. # bg: royal-pond # speaker: Narrador # pokemon: magikarp # side: right # mood: smug
"Su Alteza. Dicen que un heredero de sangre real no necesita ensuciarse las manos en la Liga Pokémon... que el dinero compra poder." # bg: royal-pond # speaker: Lord Vane # pokemon: magikarp # side: right # mood: smug
"Así que traje un escuadrón a la altura de su experiencia real: seis Magikarp del estanque de palacio. Si tan siquiera duda, la corte sabrá que es un fraude." # bg: royal-pond # speaker: Lord Vane # pokemon: magikarp # side: right # mood: smug
El Consejero Real se inclina hacia ti en voz baja. # bg: royal-pond # speaker: Consejero Real # side: left # mood: serious
"Alteza, Arceus responde a su vínculo. Su Ataque Físico y Ataque Especial son idénticos (120 / 120), así que su enfoque hoy definirá por completo su set en el combate." # bg: royal-pond # speaker: Consejero Real # pokemon: arceus # side: left # mood: serious

* [Vía Física: "Que Arceus barra el campo con velocidad y fuerza bruta."]
    ~ arceus_build = "physical"
    -> elegir_build_fisico
* [Vía Especial: "Que Arceus los juzgue desde la distancia con poder especial."]
    ~ arceus_build = "special"
    -> elegir_build_especial
* [Vía Elemental: "Entréguenle la Placa Trueno. Terminemos esto con rayos."]
    ~ arceus_build = "electric"
    -> elegir_build_electrico

=== elegir_build_fisico ===
Asientes con firmeza. El anillo dorado de Arceus destella con una aura carmesí de combate directo. # bg: royal-pond # speaker: Narrador # pokemon: arceus # side: left # mood: fierce
"Velocidad Extrema y Danza Espada. Si quiere un espectáculo, le daré una ejecución instantánea." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: arceus # side: left # mood: confident
-> decision_escolta

=== elegir_build_especial ===
Cierra los ojos un segundo y estabilizas tu pulso. La luz alrededor de Arceus se vuelve fría y quirúrgica. # bg: royal-pond # speaker: Narrador # pokemon: arceus # side: left # mood: calm
"Paz Mental, Sentencia y Rayo. No pienso ni acercarme a sus trucos baratos." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: arceus # side: left # mood: confident
-> decision_escolta

=== elegir_build_electrico ===
Tomas la Placa Trueno del estuche real y la alzas. El cuerpo de Arceus cambia de matiz mientras chispas doradas cruzan el estanque. # bg: royal-pond # speaker: Narrador # pokemon: arceus-electric # side: left # mood: fierce
"Contra seis peces de tipo Agua, la eficiencia es cortesía real. Arceus-Eléctrico se encargará." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: arceus-electric # side: left # mood: confident
-> decision_escolta

=== decision_escolta ===
El Capitán de la Guardia da un paso adelante, con la mano sobre el cinturón de seguridad del palacio. # bg: royal-pond # speaker: Capitán de la Guardia # side: left # mood: serious
"Alteza, aunque Arceus basta de sobra, el protocolo permite asignar un escolta adicional a su equipo. ¿Desea pelear completamente solo o llevar refuerzo?" # bg: royal-pond # speaker: Capitán de la Guardia # side: left # mood: serious

* [Ir solo con Arceus (1 vs 6 — Modo Testing Puro)]
    ~ player_companion = "none"
    "Nadie más. Un solo Pokémon contra sus seis Magikarp. Así nadie en la corte podrá cuestionar el resultado." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: arceus # side: left # mood: confident
    -> decision_rival
* [Llevar a Arcanine (Guardaespaldas del Equipo de Vida Diaria)]
    ~ player_companion = "arcanine"
    "Que Arcanine vigile mi flanco. Siempre es prudente tener al guardaespaldas cerca." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: arcanine # side: left # mood: calm
    -> decision_rival
* [Convocar a Gallade (Caballero del Equipo de Combate)]
    ~ player_companion = "gallade"
    "Llama a Gallade. Si esto es un duelo de honor aristocrático, que venga nuestro espadachín." # bg: royal-pond # speaker: Príncipe Heredero # pokemon: gallade # side: left # mood: confident
    -> decision_rival

=== decision_rival ===
Lord Vane escucha tus preparativos y aprieta los dientes. Alza la voz para que todos los periodistas de Wyndon lo escuchen. # bg: royal-pond # speaker: Narrador # pokemon: magikarp # side: right # mood: smug
"¿Y bien, Alteza? ¿Aceptará mi ofrenda ceremonial de seis Magikarp comunes... o se atreve a insultar a mi casa delante de toda la prensa?" # bg: royal-pond # speaker: Lord Vane # pokemon: magikarp # side: right # mood: smug

* [Mantener la etiqueta real: "Acepto tu duelo tal como lo propusiste."]
    ~ rival_stance = "ceremonial"
    Lord Vane suelta una carcajada confiada y lanza sus seis Poké Balls ceremoniales al terreno de combate. # bg: royal-pond # speaker: Narrador # pokemon: magikarp # side: right # mood: smug
    "¡Seis Magikarp nivel 50 con Salpicadura! ¡Veamos si realmente tiene nervios para acabarlos uno por uno!" # bg: royal-pond # speaker: Lord Vane # pokemon: magikarp # side: right # mood: smug
    -> cierre_pre_combate
* [Humillarlo públicamente: "Tus primos Tizonio y Dargo ni siquiera son realeza legítima."]
    ~ rival_stance = "provoked"
    El rostro de Lord Vane se torna púrpura de rabia. Arroja las Poké Balls falsas al suelo y saca un maletín negro con objetos de mercado negro. # bg: royal-pond # speaker: Narrador # pokemon: magikarp # side: right # mood: angry
    "¡Maldito crío insolente! ¡Entonces enfrentarás a mis seis Magikarp nivel 100 entrenados con Bandas Focus, Cintas Elegidas y Azote!" # bg: royal-pond # speaker: Lord Vane # pokemon: magikarp # side: right # mood: angry
    -> cierre_pre_combate

=== cierre_pre_combate ===
El árbitro real levanta el estandarte de la Corona. El árbol de decisiones ha compilado los equipos en formato Pokémon Showdown. # bg: royal-pond # speaker: Sistema Táctico # pokemon: arceus # side: left # mood: serious
{ player_companion == "none": Tu único Pokémon en línea es Arceus. Objetivo: derrotar a los 6 Magikarp de Lord Vane. }
{ player_companion == "arcanine": Arceus entra al frente escoltado por Arcanine en la reserva. Objetivo: derrotar a los 6 Magikarp. }
{ player_companion == "gallade": Arceus entra al frente respaldado por Gallade en la reserva. Objetivo: derrotar a los 6 Magikarp. }
-> END
