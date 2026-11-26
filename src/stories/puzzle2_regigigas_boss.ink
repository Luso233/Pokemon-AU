VAR puzzle2_lead = "dragapult_farigiraf"

-> camara_sellada

=== camara_sellada ===
# BG: titan-sanctum
# SPEAKER: Narrador
Las puertas rúnicas de la cámara subterránea se abren con un estruendo sísmico. Seis puntos luminosos parpadean en la oscuridad: el Coloso ya despertó.
# SPEAKER: Custodio del Coloso
# CHAR: colossus_keeper
Llegaste demasiado tarde, heredero. Mis cinco acólitos ya transfirieron su bendición al Titán. Su Inicio Lento (Slow Start) se ha extinguido por completo.
# SPEAKER: Custodio del Coloso
# CHAR: colossus_keeper
Regigigas (Nv. 85) se alza tras un Sustituto, Reflejo y Pantalla Luz, envuelto en Acua Aro, Arraigo y Restos, con +1 en Ataque, Defensa y Defensa Especial. ¡Romper sus barreras será inútil si no cortas su regeneración!
# SPEAKER: Príncipe Heredero
# CHAR: prince
Es una fortaleza viviente... pero trajimos herramientas quirúrgicas de Nivel 55 para desmontar cada capa:
# SPEAKER: Príncipe Heredero
# CHAR: prince
Dragapult (Allanamiento) atraviesa Sustituto y Pantallas; Farigiraf (Cola Armadura + Psicorruido) bloquea prioridad enemiga y corta toda curación; Weavile (Demolición) rompe Pantallas; y Murkrow (Bromista + Niebla) borra sus mejoras.

* [Abrir con Dragapult + Farigiraf (Presión Infiltrator + Psicorruido Turno 1)]
    ~ puzzle2_lead = "dragapult_farigiraf"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    ¡Cortemos su regeneración de inmediato con Psicorruido y golpeemos a través del Sustituto con Dragapult!
    -> inicio_puzzle

* [Abrir con Murkrow + Weavile (Niebla Prankster + Demolición rompe-pantallas)]
    ~ puzzle2_lead = "murkrow_weavile"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    Primero limpiemos sus mejoras con Niebla y hagamos añicos Reflejo y Pantalla Luz con Demolición.
    -> inicio_puzzle

* [Abrir con Urshifu + Farigiraf (Puño Invisible + Golpe Oscuro crítico garantizado)]
    ~ puzzle2_lead = "urshifu_farigiraf"
    # SPEAKER: Príncipe Heredero
    # CHAR: prince
    Golpe Oscuro siempre asesta crítico ignorando Reflejo y sus boosts defensivos, mientras Farigiraf sella su curación.
    -> inicio_puzzle

=== inicio_puzzle ===
# SPEAKER: Custodio del Coloso
# CHAR: colossus_keeper
¡Despierta, Regigigas! ¡Aplasta a los intrusos mientras Grimmsnarl, Clefairy, Comfey, Alcremie y Sableye te sostienen!
-> END
