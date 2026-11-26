VAR rival_read = "ironcrown"

-> salon_duelo

=== salon_duelo ===
Las puertas de roble de la Sala de Juicio se abren de golpe, interrumpiendo la audiencia del consejo. El sonido seco de una lanza al golpear el mármol apaga todas las conversaciones del salón. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
Al centro del pasillo permanece de pie una guerrera de armadura bronceada y cintas carmesí, con el emblema dorado de Falinks sobre el hombro izquierdo. Trae polvo de caminos largos en las botas y una determinación sin fisuras en la mirada. # bg: honor-duel-hall # speaker: Narrador # char: court_duelist # side: right # pokemon: none # mood: serious
«Viajé tres semanas desde las tierras sometidas del sur para mirar a la cara al heredero de este imperio.» Apunta la lanza hacia el estrado real sin que le tiemble el pulso. «Tu corona se alimenta de los tributos de mi pueblo mientras aquí se brindan discursos elegantes.» # bg: honor-duel-hall # speaker: La Duelista de la Frontera # char: court_duelist # side: right # pokemon: none # mood: fierce
Los guardias avanzan con las manos en sus Poké Balls, pero levantas un brazo para detenerlos. La ley antigua de la corte es clara: un agravio de sangre no puede ser rechazado por quien aspira al trono. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: serious
«Si vienes a cobrar la deuda de mi casa, hazlo conmigo, no con la guardia.» Desciendes las escaleras de mármol hasta el círculo de piedra. «Dime tus términos.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: metagross # mood: serious
Ella arroja tres Poké Balls sobre el terciopelo negro del altar, dejando claro el viejo código: tres representantes a la vista, pero solo uno entra al círculo. Sin relevos, sin clemencia y sin salida para quien caiga. # bg: honor-duel-hall # speaker: Narrador # char: court_duelist # side: right # pokemon: none # mood: serious
«Un combate uno contra uno hasta el final, heredero. Si caigo aquí, mi sangre cierra la cuenta. Pero si te derroto frente a tu propia corte, mi pueblo jamás volverá a arrodillarse ante Galar.» # bg: honor-duel-hall # speaker: La Duelista de la Frontera # char: court_duelist # side: right # pokemon: none # mood: fierce
El salón queda en un silencio absoluto antes de la campana. Ella no se esconde tras máscaras ni burlas, pero cada fibra de su postura delata qué clase de golpe piensa lanzar en el primer respiro. ¿Qué detalle observas antes de elegir? # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: primarina # mood: serious

* [Fijar la vista en la cápsula metálica fría que roza su guante derecho]
    ~ rival_read = "ironcrown"
    Un reflejo helado parpadea junto a sus nudillos: no busca un intercambio largo, sino cortar la distancia con una ráfaga veloz y quirúrgica desde el primer instante. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: metagross # mood: confident
    «Entiendo. Viene decidida a quebrar cualquier guardia con velocidad fría.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: metagross # mood: confident
    -> cierre_1v1
* [Escuchar el ritmo sereno de su respiración mientras afirma las botas en el centro]
    ~ rival_read = "skeledirge"
    No inclina el cuerpo hacia adelante; planta los pies con la calma de quien piensa aguantar el primer choque y desgastarte poco a poco hasta que el fuego te consuma. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: primarina # mood: confident
    «No tiene prisa. Piensa resistir nuestra embestida y devolverla multiplicada.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: primarina # mood: confident
    -> cierre_1v1
* [Vigilar la tensión contenida en su hombro izquierdo, lista para una estocada brutal]
    ~ rival_read = "urshifu"
    Aprieta el mango de la lanza contra el suelo y baja el mentón: toda su apuesta está puesta en un solo impacto devastador capaz de partir cualquier escudo de cuajo. # bg: honor-duel-hall # speaker: Narrador # char: prince # side: left # pokemon: gallade # mood: confident
    «Un solo golpe para cerrar la historia... si dudamos un segundo, termina ahí.» # bg: honor-duel-hall # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gallade # mood: confident
    -> cierre_1v1

=== cierre_1v1 ===
La campana de bronce retumba en la sala del consejo. El heredero del imperio y la guerrera de la frontera eligen a su único campeón. # bg: honor-duel-hall # speaker: Narrador # char: court_duelist # side: right # pokemon: none # mood: serious
-> END
