VAR puzzle2_lead = "dragapult_farigiraf"

-> camara_sellada

=== camara_sellada ===
Las puertas rúnicas de la cámara subterránea se abren con un estruendo sísmico. Seis puntos luminosos parpadean en la oscuridad: el Coloso ya despertó. # bg: titan-sanctum # speaker: Narrador # char: prince # side: left # pokemon: none
«Llegaste demasiado tarde, heredero. Mis cinco acólitos ya transfirieron su bendición al Titán. Su Inicio Lento (Slow Start) se ha extinguido por completo.» # bg: titan-sanctum # speaker: Custodio del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
«Regigigas (Nv. 85) se alza tras un Sustituto, Reflejo y Pantalla Luz, envuelto en Acua Aro, Arraigo y Restos, con +1 en Ataque, Defensa y Defensa Especial. ¡Romper sus barreras será inútil si no cortas su regeneración!» # bg: titan-sanctum # speaker: Custodio del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
«Es una fortaleza viviente... pero trajimos herramientas quirúrgicas de Nivel 55 para desmontar cada capa.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: dragapult
«Dragapult (Allanamiento) atraviesa Sustituto y Pantallas; Farigiraf (Cola Armadura + Psicorruido) corta toda curación; Weavile (Demolición) rompe Pantallas; y Murkrow (Bromista + Niebla) borra sus mejoras.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: farigiraf

* [Abrir con Dragapult + Farigiraf (Presión Infiltrator + Psicorruido Turno 1)]
    ~ puzzle2_lead = "dragapult_farigiraf"
    «¡Cortemos su regeneración de inmediato con Psicorruido y golpeemos a través del Sustituto con Dragapult!» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: dragapult
    -> inicio_puzzle

* [Abrir con Murkrow + Weavile (Niebla Prankster + Demolición rompe-pantallas)]
    ~ puzzle2_lead = "murkrow_weavile"
    «Primero limpiemos sus mejoras con Niebla y hagamos añicos Reflejo y Pantalla Luz con Demolición.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: murkrow
    -> inicio_puzzle

* [Abrir con Urshifu + Farigiraf (Puño Invisible + Golpe Oscuro crítico garantizado)]
    ~ puzzle2_lead = "urshifu_farigiraf"
    «Golpe Oscuro siempre asesta crítico ignorando Reflejo y sus boosts defensivos, mientras Farigiraf sella su curación.» # bg: titan-sanctum # speaker: Príncipe Heredero # char: prince # side: left # pokemon: urshifu
    -> inicio_puzzle

=== inicio_puzzle ===
«¡Despierta, Regigigas! ¡Aplasta a los intrusos mientras Grimmsnarl, Clefairy, Comfey, Alcremie y Sableye te sostienen!» # bg: titan-sanctum # speaker: Custodio del Coloso # char: colossus_keeper # side: right # pokemon: regigigas
-> END
