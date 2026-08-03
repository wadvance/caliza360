<?php

return [
    /*
    |--------------------------------------------------------------------------
    | División política de Panamá
    |--------------------------------------------------------------------------
    | Provincias → Distritos → Corregimientos.
    | Se usa en la captura de destinos (proformas, despachos) y referencia geográfica.
    */

    'provincias' => [
        [
            'nombre' => 'Bocas del Toro',
            'distritos' => [
                ['nombre' => 'Bocas del Toro', 'corregimientos' => ['Bocas del Toro', 'Bastimentos', 'Cauchero', 'Punta Laurel', 'Tierra Oscura']],
                ['nombre' => 'Chiriquí Grande', 'corregimientos' => ['Chiriquí Grande', 'Guabito', 'Miramar', 'Punta Róbalo', 'Rambala']],
            ],
        ],
        [
            'nombre' => 'Coclé',
            'distritos' => [
                ['nombre' => 'Penonomé', 'corregimientos' => ['Penonomé', 'Chiguirí Arriba', 'El Coco', 'Río Grande', 'Toabré']],
                ['nombre' => 'Aguadulce', 'corregimientos' => ['Aguadulce', 'Barrios Unidos', 'El Cristo', 'El Roble', 'Pocrí']],
                ['nombre' => 'Antón', 'corregimientos' => ['Antón', 'Caballero', 'El Chirú', 'El Valle', 'San Juan de Dios']],
                ['nombre' => 'La Pintada', 'corregimientos' => ['La Pintada', 'El Harino', 'Llano Grande', 'Piedras Gordas']],
                ['nombre' => 'Natá', 'corregimientos' => ['Natá', 'Capellanía', 'El Caño', 'Toza']],
                ['nombre' => 'Olá', 'corregimientos' => ['Olá', 'El Copé', 'La Pava']],
            ],
        ],
        [
            'nombre' => 'Colón',
            'distritos' => [
                ['nombre' => 'Colón', 'corregimientos' => ['Barrio Norte', 'Barrio Sur', 'Cativá', 'Cristóbal', 'Puerto Pilón', 'Sabanitas']],
                ['nombre' => 'Portobelo', 'corregimientos' => ['Portobelo', 'Gobea', 'María Chiquita']],
                ['nombre' => 'Chagres', 'corregimientos' => ['Nuevo Chagres', 'Achiote', 'San Juan']],
                ['nombre' => 'Donoso', 'corregimientos' => ['Miguel de la Borda', 'Coclé del Norte']],
                ['nombre' => 'Santa Isabel', 'corregimientos' => ['Palmira', 'Miramar', 'Caño', 'Nuevo Vigía', 'Sambú']],
            ],
        ],
        [
            'nombre' => 'Chiriquí',
            'distritos' => [
                ['nombre' => 'David', 'corregimientos' => ['David', 'Bijagual', 'Chiriquí', 'Las Lomas', 'San Carlos']],
                ['nombre' => 'Boquete', 'corregimientos' => ['Boquete', 'Caldera', 'Los Naranjos', 'Palmira']],
                ['nombre' => 'Bugaba', 'corregimientos' => ['La Concepción', 'San Andrés', 'Santa Marta']],
                ['nombre' => 'Barú', 'corregimientos' => ['Puerto Armuelles', 'Limones', 'Progreso']],
                ['nombre' => 'Alanje', 'corregimientos' => ['Alanje', 'Divalá', 'Guariviara', 'Querévalo', 'Santo Tomás']],
                ['nombre' => 'Dolega', 'corregimientos' => ['Dolega', 'Dos Ríos', 'Los Anastacios', 'Potrerillos']],
                ['nombre' => 'Gualaca', 'corregimientos' => ['Gualaca', 'Hornito', 'Los Ángeles', 'Paja de Sombrero']],
                ['nombre' => 'Renacimiento', 'corregimientos' => ['Río Sereno', 'Dominical', 'Plaza de Caisán', 'Santa Cruz', 'Breñón']],
                ['nombre' => 'San Lorenzo', 'corregimientos' => ['Horconcitos', 'Boca Chica', 'Chiriquí', 'Paja Blanca']],
                ['nombre' => 'Tierras Altas', 'corregimientos' => ['Volcán', 'Cerro Punta', 'Nueva California', 'Paso Ancho']],
            ],
        ],
        [
            'nombre' => 'Darién',
            'distritos' => [
                ['nombre' => 'Chepigana', 'corregimientos' => ['La Palma', 'Agua Fría', 'Camogantí', 'Cucunatí', 'Jaqué', 'Punta Piña']],
                ['nombre' => 'Pinogana', 'corregimientos' => ['El Real de Santa María', 'Paya', 'Pucuro', 'Yaviza']],
                ['nombre' => 'Santa Fe', 'corregimientos' => ['Santa Fe', 'Puerto Piña']],
            ],
        ],
        [
            'nombre' => 'Herrera',
            'distritos' => [
                ['nombre' => 'Chitré', 'corregimientos' => ['Chitré', 'La Arena', 'Monagrillo', 'San Juan Bautista']],
                ['nombre' => 'Ocú', 'corregimientos' => ['Ocú', 'Los Llanos', 'Llano Grande', 'Peñas Chatas']],
                ['nombre' => 'Pesé', 'corregimientos' => ['Pesé', 'El Barrero', 'Los Canelos', 'Sabana Grande']],
                ['nombre' => 'Los Pozos', 'corregimientos' => ['Los Pozos', 'Capellanía', 'El Pajonal', 'Las Guabas']],
                ['nombre' => 'Las Minas', 'corregimientos' => ['Las Minas', 'Chumagal', 'Chepo', 'El Cedro', 'Quebrada del Rosario']],
                ['nombre' => 'Parita', 'corregimientos' => ['Parita', 'Cabúya', 'Los Castillos', 'Llano de la Cruz', 'París']],
                ['nombre' => 'Santa María', 'corregimientos' => ['Santa María', 'Chupampa', 'El Rincón', 'El Limón', 'Los Canelos']],
            ],
        ],
        [
            'nombre' => 'Los Santos',
            'distritos' => [
                ['nombre' => 'Las Tablas', 'corregimientos' => ['Las Tablas', 'El Cocal', 'La Laja', 'La Palma', 'Las Cruces']],
                ['nombre' => 'Los Santos', 'corregimientos' => ['La Villa de los Santos', 'La Colorada', 'Las Guabas', 'Pedregoso']],
                ['nombre' => 'Guararé', 'corregimientos' => ['Guararé', 'El Espinal', 'La Miel', 'Las Trancas']],
                ['nombre' => 'Pedasí', 'corregimientos' => ['Pedasí', 'Los Asientos', 'Oria Arriba', 'Purio']],
                ['nombre' => 'Tonosí', 'corregimientos' => ['Tonosí', 'Cambutal', 'El Bebedero', 'La Tronosa']],
                ['nombre' => 'Macaracas', 'corregimientos' => ['Macaracas', 'Bahía Honda', 'Las Cruces', 'Llano Largo', 'Valle Rico']],
                ['nombre' => 'Pocrí', 'corregimientos' => ['Pocrí', 'El Cañafístulo', 'Las Lajas', 'Sabana de la Nata']],
            ],
        ],
        [
            'nombre' => 'Panamá',
            'distritos' => [
                ['nombre' => 'Panamá', 'corregimientos' => ['San Felipe', 'El Chorrillo', 'Santa Ana', 'Calidonia', 'Curundú', 'Bella Vista', 'Bethania', 'Parque Lefevre', 'Río Abajo', 'San Francisco', 'Pueblo Nuevo', 'Juan Díaz', 'Pedregal', 'Tocumen', 'Pacora', 'Las Garzas', '24 de Diciembre', 'Las Cumbres', 'Alcalde Díaz', 'Ancón', 'Chilibre', 'Caimitillo', 'Ernesto Córdoba Campos']],
                ['nombre' => 'San Miguelito', 'corregimientos' => ['Amelia Denis de Icaza', 'Belisario Porras', 'Belisario Frías', 'José Domingo Espinar', 'Mateo Iturralde', 'Omar Torrijos', 'Rufina Alfaro', 'Victoriano Lorenzo', 'Arnulfo Arias']],
                ['nombre' => 'Balboa', 'corregimientos' => ['San Miguel', 'La Ensenada', 'La Esmeralda', 'La Guinea', 'Saboga']],
                ['nombre' => 'Chepo', 'corregimientos' => ['Chepo', 'Cañita', 'Chepillo', 'El Llano', 'Las Margaritas']],
                ['nombre' => 'Chimán', 'corregimientos' => ['Chimán', 'Brujas', 'Gonzalo Vásquez', 'Unión Santeña']],
                ['nombre' => 'Taboga', 'corregimientos' => ['Taboga', 'Otoque Occidente', 'Otoque Oriente']],
            ],
        ],
        [
            'nombre' => 'Panamá Oeste',
            'distritos' => [
                ['nombre' => 'La Chorrera', 'corregimientos' => ['La Chorrera', 'Barrio Balboa', 'Barrio Colón', 'Amador', 'Arosemena', 'El Arado', 'El Coco', 'Guadalupe', 'Herrera', 'Hurtado', 'Iturralde', 'La Represa', 'Los Díaz', 'Mendoza', 'Obaldía', 'Playa Leona', 'Puerto Caimito', 'Santa Rita']],
                ['nombre' => 'Arraiján', 'corregimientos' => ['Arraiján', 'Juan Demóstenes Arosemena', 'Nuevo Emperador', 'Santa Clara', 'Veracruz', 'Vista Alegre', 'Burunga', 'Cerro Silvestre']],
                ['nombre' => 'Capira', 'corregimientos' => ['Capira', 'Caimito', 'Campana', 'Cirí de Los Sotos', 'Cirí Grande', 'El Cacao', 'La Trinidad', 'Las Ollas Arriba', 'Lídice', 'Villa Carmen', 'Villa Rosario', 'Santa Rosa']],
                ['nombre' => 'Chame', 'corregimientos' => ['Chame', 'Bejuco', 'Buenos Aires', 'Cabuya', 'Chicá', 'El Líbano', 'Las Lajas', 'Nueva Gorgona', 'Punta Chame', 'Sajalices', 'Sorá']],
                ['nombre' => 'San Carlos', 'corregimientos' => ['San Carlos', 'El Espino', 'El Higo', 'Guayabito', 'La Ermita', 'La Laguna', 'Las Uvas', 'Los Llanitos', 'San José']],
            ],
        ],
        [
            'nombre' => 'Veraguas',
            'distritos' => [
                ['nombre' => 'Santiago', 'corregimientos' => ['Santiago', 'La Colorada', 'La Peña', 'San Martín de Porres', 'Urracá', 'Rincón Largo', 'San Pedro del Espino']],
                ['nombre' => 'Soná', 'corregimientos' => ['Soná', 'Bahía Honda', 'Guarumal', 'La Soledad', 'Río Grande']],
                ['nombre' => 'Santa Fe', 'corregimientos' => ['Santa Fe', 'El Alto', 'San Luis', 'Los Guayabos', 'San José']],
                ['nombre' => 'Montijo', 'corregimientos' => ['Montijo', 'Isla de Gobernadora', 'León', 'Pilón', 'Unión del Norte']],
                ['nombre' => 'Mariato', 'corregimientos' => ['Mariato', 'Arenas', 'El Cacao', 'Quebro', 'Tebario']],
                ['nombre' => 'Cañazas', 'corregimientos' => ['Cañazas', 'El Picador', 'Los Valles', 'San José']],
                ['nombre' => 'Calobre', 'corregimientos' => ['Calobre', 'Barnizal', 'El Amparo', 'La Raya de Calobre', 'San Isidro']],
                ['nombre' => 'Río de Jesús', 'corregimientos' => ['Río de Jesús', 'Cativas', 'Guaca Arriba', 'Los Castillos', 'Tres Quebradas']],
                ['nombre' => 'San Francisco', 'corregimientos' => ['San Francisco', 'Corral Falso', 'El Año', 'Las Huacas', 'San José']],
            ],
        ],
        [
            'nombre' => 'Guna Yala',
            'distritos' => [
                ['nombre' => 'Narganá', 'corregimientos' => ['Narganá', 'Ailigandí', 'Achutupo', 'Mulatupo', 'Ustupo', 'El Porvenir']],
                ['nombre' => 'Puerto Obaldía', 'corregimientos' => ['Puerto Obaldía', 'Corazón de Jesús', 'Playón Chico', 'Tubualá', 'Wargandí']],
            ],
        ],
        [
            'nombre' => 'Emberá-Wounaan',
            'distritos' => [
                ['nombre' => 'Cémaco', 'corregimientos' => ['Unión Chocó', 'Aruza', 'Jaque', 'Manené', 'Río Sabalo']],
                ['nombre' => 'Sambú', 'corregimientos' => ['Sambú', 'Rincón', 'Setegantí']],
            ],
        ],
        [
            'nombre' => 'Ngäbe-Buglé',
            'distritos' => [
                ['nombre' => 'Müna', 'corregimientos' => ['Chichica', 'Bisira', 'Cerro Café', 'Man Creek', 'Müna', 'Nole Duima']],
                ['nombre' => 'Besikó', 'corregimientos' => ['Soloy', 'Calante', 'Kebir Dachi', 'Tobobe']],
                ['nombre' => 'Kankintú', 'corregimientos' => ['Kankintú', 'Bisira', 'Guariviara', 'Llano Tugrí']],
                ['nombre' => 'Kusapín', 'corregimientos' => ['Kusapín', 'Boca de Balsa', 'Calovebora', 'Río Caña']],
                ['nombre' => 'Ñürüm', 'corregimientos' => ['Buenos Aires', 'Agua de Salud', 'El Alto de Jesús', 'Guayabito', 'Mirono']],
            ],
        ],
    ],
];
