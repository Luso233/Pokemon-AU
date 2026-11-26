VAR puzzle_hint = "show"

-> inicio_puzzle

=== inicio_puzzle ===
El patio solar de la fortaleza arde bajo una luz artificial insoportable. El aire vibra sobre las losas calientes y un viento rabioso barre la arena desde el lado contrario, empujando cenizas hacia tu rostro. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: sableye # mood: tense
La emboscada empezó antes de que pisaras el centro: Sableye ya respira agitado con rasguños frescos en los hombros, y el suelo alrededor de tus botas está sembrado de astillas afiladas de roca. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: inkay # mood: tense
Del otro lado, el Estratega Solar observa desde la sombra de la galería con los brazos cruzados. Sus dos figuras ya resplandecen con una energía acumulada que hace zumbar el calor del patio. # bg: sunlit-courtyard # speaker: Narrador # char: assassin # side: right # pokemon: none # mood: ominous
«En un choque frontal estás acabado antes de parpadear, Alteza.» Su tono suena casi aburrido. «Veamos si sabes qué hacer cuando el tablero entero está inclinado en tu contra.» # bg: sunlit-courtyard # speaker: Estratega Solar # char: assassin # side: right # pokemon: none # mood: smug

* [Tomarte un segundo para estudiar el movimiento exacto de sus sombras bajo el calor]
    ~ puzzle_hint = "show"
    Notas la rigidez en su postura: tanta ventaja acumulada vuelve a sus atacantes ansiosos y predecibles. Cuando alguien apuesta todo a barrer en dos latidos, su propia fuerza puede volverse una soga. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: ditto # mood: confident
    -> fin_puzzle
* [Entrar directo a la arena sin detenerte a calcular desde la orilla]
    ~ puzzle_hint = "hide"
    «Suficiente charla. Lo resolveremos sobre la marcha.» # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: inkay # mood: serious
    -> fin_puzzle

=== fin_puzzle ===
El resplandor solar ciega por un segundo el patio entero. Sableye, Inkay y Ditto quedan solos frente a la tormenta. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
-> END
