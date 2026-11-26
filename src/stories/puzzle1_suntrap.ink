VAR puzzle_hint = "show"

-> inicio_puzzle

=== inicio_puzzle ===
El patio solar arde bajo un foco artificial insoportable. El sudor te corre por la sien mientras el calor levanta espejismos sobre las losas y el viento caliente arrastra ceniza contra tu cara. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: sableye # mood: tense
La trampa ya estaba montada cuando pisaste la arena: Sableye respira agitado con rasguños frescos y el terreno alrededor de tus pies está lleno de astillas de roca. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: inkay # mood: tense
Algo te inquieta todavía más que el calor. Gardevoir presiona una mano contra su sien y te transmite un vacío extraño: sobre la arena hay dos Pokémon potenciados al máximo... pero ni un rastro de presencia humana o vínculo emocional acompañándolos. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: gardevoir # mood: tense
Entonces escuchas el zumbido de un compresor industrial a veinte metros. Detrás de un cristal polarizado, estacionada a la sombra, hay una cabina móvil con aire acondicionado a tope. La ventanilla baja dos dedos y un altavoz distorsionado escupe el ruido de una lata abriéndose. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: none # mood: smug
Dentro, repantigado en un sillón motorizado con pantuflas de Snorlax, pijama manchada de frituras, capa real de disfraz, visor VR y un monitor curvo con seis cámaras a la vez, un niño con la cara roja de bebidas energéticas apunta un joystick hacia ti. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: none # mood: smug
«¡JAJAJA! ¿Qué pasa, Alteza, se te derritió el maquillaje ahí afuera? ¡Bro, literalmente tengo el aire a dieciséis grados mientras mis macros en el visor ejecutan la apertura óptima de ladder! ¡El vínculo emocional está parcheadísimo, puro humo para boomers!» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: none # mood: smug
Gardevoir tiembla de indignación silenciosa a tu lado. Ese chamaco ni siquiera siente el calor que sufren sus propios Pokémon; los maneja como fichas desechables en una pantalla para reclamar el trono por pura obsesión de ranking. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: inkay # mood: serious
«Seis cámaras, cero corazón...» Aprietas las Poké Balls mirando el cristal polarizado de la cabina. «Si tanto presumes tus algoritmos, veamos qué pasa cuando alguien les da la vuelta.» # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: ditto # mood: serious

* [Observar cómo repite la misma secuencia mecánica en el monitor de su cabina]
    ~ puzzle_hint = "show"
    Al mirar el reflejo de las seis pantallas a través del vidrio, notas algo ridículamente obvio: juega con piloto automático de ladder. Tanta ventaja inflada lo vuelve ansioso y predecible si volteas su propia fuerza en su contra. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: ditto # mood: confident
    -> fin_puzzle
* [Ignorar sus gritos por el micrófono y entrar directo al patio ardiente]
    ~ puzzle_hint = "hide"
    «Apaga ese micrófono y pelea. Vamos a enseñarte lo que no sale en tus hojas de cálculo.» # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: inkay # mood: serious
    -> fin_puzzle

=== fin_puzzle ===
El niño se baja el visor VR sobre la frente, golpea los botones del joystick con los dedos llenos de queso en polvo y desata el resplandor solar sobre el patio. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: none # mood: serious
-> END
