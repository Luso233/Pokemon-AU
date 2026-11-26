VAR dock_stance = "defiant"

-> puente_muelles

=== puente_muelles ===
Madrugada en los muelles de Wyndon. La niebla salada envuelve las grúas oxidadas y reduce el puente de carga a un pasillo estrecho de hierro húmedo. Detrás de ti los pasos se apagan: el resto de tu escolta quedó atrás reteniendo a la guardia portuaria. # bg: wyndon-docks # speaker: Narrador # char: prince # side: left # pokemon: annihilape # mood: serious
Seis siluetas robustas emergen entre los contenedores golpeando tuberías contra las barandillas. El capataz escupe al suelo y ríe con los dientes amarillos al ver una sola Poké Ball abierta a tu lado. # bg: wyndon-docks # speaker: Narrador # char: dock_militia # side: right # pokemon: none # mood: confident
«Mira nada más a quién nos dejó la marea. Sin escolta, sin escapatoria y con un solo Pokémon de pie contra toda la cuadrilla del muelle.» # bg: wyndon-docks # speaker: Capataz de los Muelles # char: dock_militia # side: right # pokemon: none # mood: confident
Los matones se empujan unos a otros para pasar al frente, ansiosos por llevarse la recompensa antes que sus propios compañeros. Uno gruñe insultos mientras su compañero del costado apenas alcanza a apartarse de sus pisotones. # bg: wyndon-docks # speaker: Narrador # char: dock_militia # side: right # pokemon: none # mood: confident
Annihilape respira hondo junto a ti; el vapor gris que brota de sus hombros se vuelve más denso con cada burla que resuena en el puente. # bg: wyndon-docks # speaker: Narrador # char: prince # side: left # pokemon: annihilape # mood: confident

* [Mantener la guardia firme y dejar que la furia de Annihilape crezca con cada choque]
    ~ dock_stance = "defiant"
    «No retrocedas ni un paso, Annihilape. Son seis, pero estorban más de lo que pelean.» # bg: wyndon-docks # speaker: Príncipe Heredero # char: prince # side: left # pokemon: annihilape # mood: confident
    -> inicio_bastion
* [Asegurar primero la respiración y medir con calma cuánto aguanta el puente]
    ~ dock_stance = "cautious"
    «Con cabeza fría, Annihilape. Esto va a ser largo; guarda aire para los últimos que salgan de la niebla.» # bg: wyndon-docks # speaker: Príncipe Heredero # char: prince # side: left # pokemon: annihilape # mood: serious
    -> inicio_bastion

=== inicio_bastion ===
La sirena lejana de un carguero atraviesa el puerto. Annihilape aprieta los puños y avanza solo hacia el centro del puente. # bg: wyndon-docks # speaker: Narrador # char: prince # side: left # pokemon: annihilape # mood: confident
-> END
