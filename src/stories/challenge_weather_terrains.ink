VAR climate_mode = "sun"

-> cabina_climas

=== cabina_climas ===
Un domo de entrenamiento robado en las afueras de Wyndon zumba como un centro de datos mal ventilado. Al fondo, la cabina móvil con aire acondicionado vuelve a estacionarse entre cables gruesos, latas vacías y generadores climáticos conectados a la fuerza. # bg: sunlit-courtyard # speaker: Narrador # char: prince # side: left # pokemon: none # mood: serious
La pantalla del domo se enciende de golpe mostrando seis puntos de vista borrosos y el rostro triunfante del Estratega Solar masticando frituras detrás de su micrófono. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: none # mood: smug
«¡Oye, príncipe npc! ¿Creíste que lo del sol era mi único setup? ¡Por favor! Yo subí al top del ladder dominando TODOS los climas y TODOS los terrenos sin pararme nunca de este sillón!» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: none # mood: smug
Golpea un botón brillante en su joystick y una cápsula especial parpadea en el brazo derecho de su trono motorizado. «Y para que te duela más el ego cuando pierdas, mi As en cada simulación va a ser mi obra maestra incomprendida: ¡Castform! El verdadero dios del clima que los casuales no saben valorar.» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: castform # mood: smug
Gardevoir exhala despacio a tu lado, acostumbrándose a la voz chillona del altavoz. «Es desesperante... pero entrenar contra los cuatro climas y los cuatro campos en un mismo domo sí nos servirá para lo que viene.» # bg: sunlit-courtyard # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: calm
Los ocho proyectores ambientales zumban alrededor del campo esperando que elijas qué simulación quieres enfrentar primero. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: serious

* [Simular uno de los 4 Climas (Sol, Lluvia, Arena o Nieve)]
    -> elegir_clima
* [Simular uno de los 4 Terrenos (Eléctrico, Hierba, Psíquico o Niebla)]
    -> elegir_terreno

=== elegir_clima ===
«¡Elige tu veneno atmosférico, bro! Sol que derrite, lluvia que ahoga, arena que raspa o nieve que congela... ¡mi Castform se adapta a todo en un frame!» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: castform # mood: smug

* [☀️ Sol Intenso — Calor abrasador y ofensiva solar]
    ~ climate_mode = "sun"
    Los focos cenitales incendian el aire del domo hasta volverlo seco y sofocante. # bg: sunlit-courtyard # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [🌧️ Lluvia Torrencial — Diluvio y velocidad imparable]
    ~ climate_mode = "rain"
    Los rociadores del techo descargan un aguacero cerrado que inunda las losas en segundos. # bg: wyndon-alleys # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [🏜️ Tormenta de Arena — Polvo cortante y desgaste constante]
    ~ climate_mode = "sand"
    Turbinas laterales levantan un remolino de grava y arena fina que borra el horizonte del domo. # bg: banner-battlefield # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [❄️ Nieve Helada — Ventisca fría y velos de escarcha]
    ~ climate_mode = "snow"
    El aire cae bajo cero de golpe; cristales blancos cubren el suelo mientras la cabina del niño sube la calefacción. # bg: titan-sanctum # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo

=== elegir_terreno ===
«¡Ah, quieres jugar con campos de terreno! Más fácil todavía: mis seis pantallas calculan cada multiplicador mientras me tomo otra lata.» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: castform # mood: smug

* [⚡ Campo Eléctrico — Chispa constante y velocidad sobrecargada]
    ~ climate_mode = "electric"
    Arcos amarillos recorren las placas metálicas del piso erizando el aire de todo el recinto. # bg: vgc-worlds-stage # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [🌿 Campo de Hierba — Brote acelerado y recuperación viva]
    ~ climate_mode = "grassy"
    Un manto espeso de hierba luminosa cubre las piedras en un parpadeo, perfumando el aire húmedo. # bg: royal-training-ground # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [🔮 Campo Psíquico — Presión mental y anulación de reflejos]
    ~ climate_mode = "psychic"
    Una neblina violeta flota a ras del suelo, haciendo vibrar las sienes con un zumbido hipnótico. # bg: honor-duel-hall # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo
* [🌫️ Campo de Niebla — Velo sereno contra cualquier veneno o llama]
    ~ climate_mode = "misty"
    Una bruma rosada y densa envuelve tus tobillos apagando cualquier chispa sobre la arena. # bg: banquet-hall # speaker: Narrador # char: solar_strategist # side: right # pokemon: castform # mood: confident
    -> inicio_domo

=== inicio_domo ===
El Estratega Solar ajusta el micrófono, sonríe detrás de su visor VR y activa el tablero del domo. «¡Prepárate para ser clippeado por un Castform, Alteza!» # bg: sunlit-courtyard # speaker: El Estratega Solar # char: solar_strategist # side: right # pokemon: castform # mood: smug
-> END
