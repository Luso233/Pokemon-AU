VAR dock_stance = "defiant"

-> puente_muelles

=== puente_muelles ===
Muelles de Wyndon, madrugada. La niebla marina cierra el puente de carga mientras seis mercenarios de La Milicia de los Muelles bloquean ambas salidas. # bg: wyndon-docks # speaker: Narrador # char: prince # side: left # pokemon: annihilape # mood: serious
"¡Mira a quién atrapamos sin escolta! Tus otros Pokémon cayeron cruzando las grúas, chaval. Solo te queda ese Annihilape contra toda la cuadrilla del muelle." # bg: wyndon-docks # speaker: Capataz de los Muelles # char: dock_militia # side: right # pokemon: krookodile # mood: confident
"¡Suelten a Krookodile y Toxicroak primero! ¡Intimídenlo y arrasen el puente con Terremoto, no importa si tiemblan las vigas!" # bg: wyndon-docks # speaker: Capataz de los Muelles # char: dock_militia # side: right # pokemon: toxicroak # mood: confident
"Espera... Krookodile tiene Intimidación y está tan ciego de rabia que tirará Terremoto sobre su propio compañero Toxicroak. Con Competitivo (Defiant) y Puño Furia (Rage Fist), cada golpe que reciba hará a Annihilape imparable." # bg: wyndon-docks # speaker: Príncipe Heredero # char: prince # side: left # pokemon: annihilape # mood: confident

* [Mantener Tera Fuego defensivo y cargar Bulk Up + Rage Fist en el puente]
    ~ dock_stance = "defiant"
    "Resiste la embestida, Annihilape. ¡Cada golpe de estos mercenarios solo alimenta tu Puño Furia!" # bg: wyndon-docks # speaker: Príncipe Heredero # char: prince # side: left # pokemon: annihilape # mood: confident
    -> inicio_bastion
* [Asegurar postura ultra-prudente: estudiar primero sus debilidades y reservar Protect]
    ~ dock_stance = "cautious"
    "Cuidado con Grimmsnarl y el Regirock Tera Siniestro al final de su cuadrilla. Usa Puño Drenaje para sostener tus PS." # bg: wyndon-docks # speaker: Príncipe Heredero # char: prince # side: left # pokemon: regirock # mood: serious
    -> inicio_bastion

=== inicio_bastion ===
Desafío 1 vs. 6 en Dobles (gen9doublescustomgame). Annihilape (Raid Boss aliado) enfrenta en solitario a los 6 mercenarios de La Milicia de los Muelles. # bg: wyndon-docks # speaker: Sistema Táctico # char: prince # side: left # pokemon: annihilape # mood: confident
-> END
