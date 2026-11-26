VAR bond_tone = "respect"

-> fogata_monzon

=== fogata_monzon ===
La lluvia del monzón golpea el tejado de palma en la costa de Vayra mientras una fogata seca la humedad del puerto oculto. La Duelista de Vayra afila la punta de su lanza con una piedra de río; junto a sus botas hay macetas de barro con bayas medicinales y un botiquín de guerrilla con Bandas Focus. # bg: honor-duel-hall # speaker: Narrador # char: court_duelist # side: right # pokemon: none # mood: serious
«No te acerques tan silencioso si no quieres que la lanza responda sola, heredero.» Sin levantar la vista, empuja una taza de té amargo y un morral de semillas hacia tu lado del fuego. # bg: honor-duel-hall # speaker: La Duelista de Vayra # char: court_duelist # side: right # pokemon: urshifu # mood: serious
«Escuché lo que ocurrió entre Vayra y las Islas Naranja.» Apoyas la taza tibia entre las manos. «No son solo tributos de la CRU contra lo que peleas.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: serious
Su mano se detiene un segundo sobre la piedra de afilar. «Las guerras proxy de tu padre y la CRU destrozaron nuestras costas... y cuando el orden cayó, la dictadura agraria de las Islas Naranja aprovechó el vacío para purgar a cualquier entrenador con vínculo antiguo. En un mundo así, aprendes a ganar en el primer golpe de un 1v1 o no vuelves a casa.» # bg: honor-duel-hall # speaker: La Duelista de Vayra # char: court_duelist # side: right # pokemon: none # mood: fierce

* [«Si derrumbamos a la CRU y a las Islas Naranja, Vayra decidirá su propio destino.»]
    ~ bond_tone = "promise"
    Ella te sostiene la mirada unos segundos largos antes de clavar la lanza en la arena húmeda. «Las palabras de la realeza nunca me han servido para nada... pero tú no te escondiste detrás de una guardia cuando te reté. Toma mi Botiquín de Guerrilla; en un exilio sin curación, estas bayas te salvarán la vida.» # bg: honor-duel-hall # speaker: La Duelista de Vayra # char: court_duelist # side: right # pokemon: urshifu # mood: confident
    -> cierre_duelist_r1
* [«Enséñame cómo sobreviven tus guerrilleros sin clínicas de la Corona.»]
    ~ bond_tone = "learn"
    Una media sonrisa apenas perceptible suaviza su expresión. «Por fin un heredero que pregunta cómo vive la gente común. Siéntate; te daré acceso al huerto del monzón y a nuestras medicinas al costo.» # bg: honor-duel-hall # speaker: La Duelista de Vayra # char: court_duelist # side: right # pokemon: skeledirge # mood: confident
    -> cierre_duelist_r1

=== cierre_duelist_r1 ===
El aroma cálido del té y de las hojas de Vayra llena el refugio mientras la tormenta sigue rugiendo afuera. [Rango 1 alcanzado · Botiquín de Guerrilla: -35% curación en Campamento + 2 parcelas extra de Huerto + recuperación pasiva de PP.] # bg: honor-duel-hall # speaker: Narrador # char: court_duelist # side: right # pokemon: none # mood: confident
-> END
