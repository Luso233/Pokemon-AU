VAR puzzle_hint = "show"

-> inicio_puzzle

=== inicio_puzzle ===
El patio solar de la fortaleza arde bajo un Sol Intenso artificial. El aire tiembla por el calor y el Viento Afín del enemigo ya barre la arena. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: sableye # mood: tense
Tu Sableye ya recibió metralla antes de entrar en posición (65% PS restantes), y una trampa de Trampa Rocas bloquea tu lado del campo. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: inkay # mood: tense
Frente a ti aguardan un Metagross ya Megaevolucionado (+2 Atk, +1 Spe) y un Volcarona con doble Danza Aleteo (+2 SpA, +2 SpD, +2 Spe). # bg: sunlit-courtyard # speaker: Narrador # char: assassin # side: right # pokemon: metagross-mega # mood: ominous
"En fuerza bruta estás muerto en un turno, Alteza. Veamos si entiendes cómo invertir la balanza con Inkay, Sableye y Ditto." # bg: sunlit-courtyard # speaker: Asesino Carmesí # char: assassin # side: right # pokemon: volcarona # mood: smug

* [Analizar el patrón del rival (Mostrar pista táctica del Puzzle en el Briefing)]
    ~ puzzle_hint = "show"
    "Turno 1: Volcarona tirará Onda Ígnea y Mega Metagross irá a por Inkay con Puño Meteoro. Turno 2: Puño Bala a Inkay y otra Onda Ígnea... Podemos usar Sorpresa, Revés (Topsy-Turvy), Espacio Raro y a Ditto en su contra." # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: ditto # mood: confident
    -> fin_puzzle
* [Resolver a ciegas (Sin pista táctica — Modo Puzzle Puro)]
    ~ puzzle_hint = "hide"
    "No necesito pistas. Leeré el campo directamente." # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: inkay # mood: serious
    -> fin_puzzle

=== fin_puzzle ===
Condiciones iniciales del Puzzle cargadas en el motor @pkmn/sim. Sol Intenso, Viento Afín rival, Trampa Rocas aliada, boosts y daño previo listos. # bg: sunlit-courtyard # speaker: Sistema Táctico # char: prince # side: left # pokemon: none # mood: serious
-> END
