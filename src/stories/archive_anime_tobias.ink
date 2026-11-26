VAR ash_mindset = "sinnoh_spirit"

-> estadio_valle_lirio

=== estadio_valle_lirio ===
# BG: lily-of-the-valley
# SPEAKER: Narrador
Semifinales de la Conferencia del Valle Lirio — Liga de Sinnoh. El estadio contiene la respiración mientras un entrenador de capa oscura sube al podio frente a Ash Ketchum.
# SPEAKER: Comentarista de Sinnoh
¡Histórico! Tobías, quien barrió todos los gimnasios y rondas previas usando únicamente a Darkrai, enfrenta a Ash de Pueblo Paleta en un combate 6 contra 6.
# SPEAKER: Tobías (El del Action Replay)
# CHAR: tobias
Has llegado lejos, Ash. Pero los vínculos comunes tienen un límite frente al poder de los mitos. Permíteme mostrarte el verdadero abismo...
# SPEAKER: Ash Ketchum
# CHAR: ash_ketchum
¡No importa cuántos Pokémon legendarios tengas! Pikachu, Heracross, Sceptile, Swellow, Torkoal y Gible entrenamos toda la región para esto. ¡No nos rendiremos jamás!

* [Despertar el «Espíritu de Sinnoh» (+2 Omniboost al Líder que elijas en Team Preview)]
    ~ ash_mindset = "sinnoh_spirit"
    # SPEAKER: Ash Ketchum
    # CHAR: ash_ketchum
    ¡Vamos con todo! (Pista táctica: el Líder que elijas en el Team Preview iniciará con +2 en todas sus stats. Swellow y Torkoal tienen Relevo/Baton Pass para pasar ese +2 a Pikachu, Heracross o Sceptile... pero cuidado con el Más Psique de Cresselia.)
    -> preparacion

* [Estudiar los rumores sobre el equipo completo de Tobías]
    ~ ash_mindset = "scout_tobias"
    # SPEAKER: Narrador
    Los susurros en las gradas advierten: Tobías siempre abre con Darkrai y Brecha Negra en Turno 1, su Cresselia copia mejoras (+4 o más) con Más Psique y puede sacrificarse con Danza Lunar, y guarda a Giratina-Origen como su As final.
    # SPEAKER: Ash Ketchum
    # CHAR: ash_ketchum
    ¡Perfecto! Sabiendo eso, escogeré con cabeza fría a nuestro Líder en el Team Preview.
    -> preparacion

=== preparacion ===
# SPEAKER: Tobías (El del Action Replay)
# CHAR: tobias
Elige a tu primer Pokémon, Ash. ¡Darkrai, sumerge el campo en pesadillas!
-> END
