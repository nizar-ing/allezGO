const carouselImages = [
    {
        url: "/images/slide8.webp",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide7.webp",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
    },
    {
        url: "/images/slide1.webp",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "Découvrez la détente ultime dans nos stations balnéaires 5 étoiles exclusives à Bali et aux Maldives",
    },
    {
        url: "/images/slide2.jpg",
        alt: "Station balnéaire de luxe avec palmiers et eau cristalline",
        title: "Le Paradis Tropical Vous Attend",
        subtitle:
            "Découvrez la détente ultime dans nos stations balnéaires 5 étoiles exclusives à Bali et aux Maldives",
    },
    {
        url: "/images/slide3.jpg",
        alt: "Bungalows sur pilotis au-dessus d’une mer turquoise et paisible",
        title: "Évasion Sur Pilotis",
        subtitle:
            "Vivez une expérience unique dans des bungalows de luxe au cœur d’eaux cristallines",
    },
    {
        url: "/images/slide4.jpg",
        alt: "Plage privée avec sable blanc, mer turquoise et hôtel de luxe",
        title: "Plages Privées de Rêve",
        subtitle:
            "Profitez de plages exclusives et d’un service haut de gamme dans des cadres idylliques",
    },
    {
        url: "/images/slide5.jpg",
        alt: "Resort de luxe en bord de mer au coucher du soleil",
        title: "Couchers de Soleil Inoubliables",
        subtitle:
            "Admirez des panoramas spectaculaires depuis des hôtels de luxe en bord d’océan",
    },
    {
        url: "/images/slide6.jpg",
        alt: "Piscine de luxe face à la mer dans un hôtel haut de gamme",
        title: "Détente Absolue",
        subtitle:
            "Relaxez-vous dans des resorts de prestige offrant piscines, spas et vues marines exceptionnelles",
    },
];

const hotelOfferCards = [
    {
        id: "hotel-blue-beach-golf-spa-monastir",
        type: "hotel-offer",
        hotel: {
            name: "Blue Beach Golf & Spa",
            rating: 4,
            location: {
                city: "Monastir",
                country: "Tunisia",
                display: "Monastir - Tunisie",
            },
        },
        image: {
            src: "/images/hotels/hotel-blue-beach-golf-spa-monastir.webp",
            alt: "Blue Beach Golf & Spa Monastir",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "All Inclusive",
            boardTypeLabel: "Tout compris",
            price: {
                amount: 9800,
                currency: "DZD",
                formatted: "9 800 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "1er Enfant - 6 ans Gratuit",
                maxAge: 6,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-blue-beach-golf-spa-monastir",
        },
        badges: [{type: "family", label: "Famille"}],
        metadata: {locale: "fr-FR"},
    },

    {
        id: "hotel-dar-ismail-tabarka-sousse",
        type: "hotel-offer",
        hotel: {
            name: "Dar Ismail Tabarka",
            rating: 5,
            location: {
                city: "Tabarka",
                country: "Tunisia",
                display: "Tabarka - Tunisie",
            },
        },
        image: {
            src: "/images/hotels/hotel-dar-ismail-tabarka-sousse.webp",
            alt: "Dar Ismail Tabarka Resort",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Full Board",
            boardTypeLabel: "Pension complète",
            price: {
                amount: 11200,
                currency: "DZD",
                formatted: "11 200 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "Enfant - 5 ans Gratuit",
                maxAge: 5,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-dar-ismail-tabarka-sousse",
        },
        badges: [{type: "nature", label: "Nature & Mer"}],
        metadata: {locale: "fr-FR"},
    },

    {
        id: "hotel-eden-club-skanes-enfants",
        type: "hotel-offer",
        hotel: {
            name: "Eden Club Skanes",
            rating: 3,
            location: {
                city: "Skanes",
                country: "Tunisia",
                display: "Skanes - Tunisie",
            },
        },
        image: {
            src: "/images/hotels/hotel-eden-club-skanes-enfants.webp",
            alt: "Eden Club Skanes",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "All Inclusive",
            boardTypeLabel: "Tout compris",
            price: {
                amount: 7200,
                currency: "DZD",
                formatted: "7 200 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "2 Enfants Gratuit",
                maxAge: 12,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-eden-club-skanes-enfants",
        },
        badges: [{type: "kids", label: "Spécial Enfants"}],
        metadata: {locale: "fr-FR"},
    },

    {
        id: "hotel-ibiris-oran",
        type: "hotel-offer",
        hotel: {
            name: "Hôtel Ibiris",
            rating: 4,
            location: {
                city: "Oran",
                country: "Algeria",
                display: "Oran - Algérie",
            },
        },
        image: {
            src: "/images/hotels/hotel-ibiris-oran.webp",
            alt: "Hôtel Ibiris Oran",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Breakfast",
            boardTypeLabel: "Petit déjeuner",
            price: {
                amount: 8500,
                currency: "DZD",
                formatted: "8 500 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "Enfant - 4 ans Gratuit",
                maxAge: 4,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-ibiris-oran",
        },
        badges: [{type: "city", label: "City Hotel"}],
        metadata: {locale: "fr-FR"},
    },

    {
        id: "hotel-madaure",
        type: "hotel-offer",
        hotel: {
            name: "Hôtel Madaure",
            rating: 4,
            location: {
                city: "Batna",
                country: "Algeria",
                display: "Batna - Algérie",
            },
        },
        image: {
            src: "/images/hotels/hotel-madaure.webp",
            alt: "Hôtel Madaure Batna",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: {
                amount: 7900,
                currency: "DZD",
                formatted: "7 900 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "Enfant - 6 ans Gratuit",
                maxAge: 6,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-madaure",
        },
        badges: [{type: "business", label: "Business"}],
        metadata: {locale: "fr-FR"},
    },

    {
        id: "hotel-moevenpick-resort-marine-sousse",
        type: "hotel-offer",
        hotel: {
            name: "Mövenpick Resort & Marine Spa",
            rating: 5,
            location: {
                city: "Sousse",
                country: "Tunisia",
                display: "Sousse - Tunisie",
            },
        },
        image: {
            src: "/images/hotels/hotel-moevenpick-resort-marine-sousse.webp",
            alt: "Mövenpick Resort & Marine Spa",
            aspectRatio: "16:9",
        },
        offer: {
            boardType: "Half Board",
            boardTypeLabel: "Demi pension",
            price: {
                amount: 11900,
                currency: "DZD",
                formatted: "11 900 DZD",
                unit: "per night",
                per: "person",
            },
            childPolicy: {
                description: "1er Enfant - 7 ans Gratuit",
                maxAge: 7,
                free: true,
            },
        },
        cta: {
            label: "Voir l’offre",
            action: "VIEW_OFFER",
            url: "/offers/hotel-moevenpick-resort-marine-sousse",
        },
        badges: [{type: "luxury", label: "Luxe"}],
        metadata: {locale: "fr-FR"},
    },
    //
    // {
    //     id: "hotel-sabri-annaba",
    //     type: "hotel-offer",
    //     hotel: {
    //         name: "Hôtel Sabri",
    //         rating: 4,
    //         location: {
    //             city: "Annaba",
    //             country: "Algeria",
    //             display: "Annaba - Algérie",
    //         },
    //     },
    //     image: {
    //         src: "/images/hotels/Hotel-sabri-annaba.webp",
    //         alt: "Hôtel Sabri Annaba",
    //         aspectRatio: "16:9",
    //     },
    //     offer: {
    //         boardType: "Half Board",
    //         boardTypeLabel: "Demi pension",
    //         price: {
    //             amount: 8700,
    //             currency: "DZD",
    //             formatted: "8 700 DZD",
    //             unit: "per night",
    //             per: "person",
    //         },
    //         childPolicy: {
    //             description: "Enfant - 5 ans Gratuit",
    //             maxAge: 5,
    //             free: true,
    //         },
    //     },
    //     cta: {
    //         label: "Voir l’offre",
    //         action: "VIEW_OFFER",
    //         url: "/offers/hotel-sabri-annaba",
    //     },
    //     badges: [{type: "sea", label: "Vue Mer"}],
    //     metadata: {locale: "fr-FR"},
    // },
    //
    // {
    //     id: "le-soleil-bella-vista-resort-toboggan",
    //     type: "hotel-offer",
    //     hotel: {
    //         name: "Le Soleil Bella Vista Resort",
    //         rating: 4,
    //         location: {
    //             city: "Monastir",
    //             country: "Tunisia",
    //             display: "Monastir - Tunisie",
    //         },
    //     },
    //     image: {
    //         src: "/images/hotels/Le-Soleil-Bella-Vista-Resort-Toboggan.webp",
    //         alt: "Le Soleil Bella Vista Resort",
    //         aspectRatio: "16:9",
    //     },
    //     offer: {
    //         boardType: "All Inclusive",
    //         boardTypeLabel: "Tout compris",
    //         price: {
    //             amount: 8600,
    //             currency: "DZD",
    //             formatted: "8 600 DZD",
    //             unit: "per night",
    //             per: "person",
    //         },
    //         childPolicy: {
    //             description: "Enfant Gratuit",
    //             maxAge: 10,
    //             free: true,
    //         },
    //     },
    //     cta: {
    //         label: "Voir l’offre",
    //         action: "VIEW_OFFER",
    //         url: "/offers/le-soleil-bella-vista-resort-toboggan",
    //     },
    //     badges: [{type: "aqua", label: "Toboggans"}],
    //     metadata: {locale: "fr-FR"},
    // },
    //
    // {
    //     id: "regency-hammamet-hotel-piscine",
    //     type: "hotel-offer",
    //     hotel: {
    //         name: "Regency Hammamet",
    //         rating: 4,
    //         location: {
    //             city: "Hammamet",
    //             country: "Tunisia",
    //             display: "Hammamet - Tunisie",
    //         },
    //     },
    //     image: {
    //         src: "/images/hotels/Regency-Hammamet-Hotel-piscine.webp",
    //         alt: "Regency Hammamet Hotel",
    //         aspectRatio: "16:9",
    //     },
    //     offer: {
    //         boardType: "Half Board",
    //         boardTypeLabel: "Demi pension",
    //         price: {
    //             amount: 9100,
    //             currency: "DZD",
    //             formatted: "9 100 DZD",
    //             unit: "per night",
    //             per: "person",
    //         },
    //         childPolicy: {
    //             description: "Enfant - 6 ans Gratuit",
    //             maxAge: 6,
    //             free: true,
    //         },
    //     },
    //     cta: {
    //         label: "Voir l’offre",
    //         action: "VIEW_OFFER",
    //         url: "/offers/regency-hammamet-hotel-piscine",
    //     },
    //     badges: [{type: "pool", label: "Piscine"}],
    //     metadata: {locale: "fr-FR"},
    // },
];

const testimonials = [
    {
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "Sarah Johnson",
        citation: "Travailler avec cette équipe a été une expérience fantastique. Ils ont livré à temps et ont dépassé nos attentes."
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        name: "Michael Chen",
        citation: "Professionnels, fiables et très compétents. Je les recommanderais sans hésitation à n'importe qui."
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        name: "Emily Rodriguez",
        citation: "Leur souci du détail et leur communication claire ont rendu l'ensemble du processus fluide et sans stress."
    },
    {
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        name: "David Thompson",
        citation: "Résultats exceptionnels et excellente collaboration. Nous avons constaté un impact réel dès le premier jour."
    }
];

const destinations = [
    {
        id: 1,
        name: "Azerbaïdjan",
        image_url: "/images/destinations/Azerbaijan.jpg",
        mainCities: ["Bakou", "Gabala"],
        duration: {
            days: 8,
            nights: 7
        },
        departureFrom: "Alger",
        airline: "Turkish Airlines",
        flightDetails: {
            arrival: "morning",
            departure: "midday",
            via: "Istanbul"
        },
        highlights: [
            "E-visa assuré, sans refus",
            "Destination moderne, sûre et très appréciée",
            "Plus de 15 groupes déjà opérés",
            "Accompagnateur de l'agence + guide local arabophone"
        ],
        accommodation: [
            {location: "Bakou", hotel: "Iris Hotel", stars: 4, nights: 4},
            {location: "Gabala", hotel: "Yengice Hotel", stars: 5, nights: 3}
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billetterie vols Turkish Airlines",
            "Visa électronique",
            "Tous les transferts en bus touristique",
            "Excursions selon programme",
            "Téléphérique Shahdag",
            "Accompagnateur de l'agence",
            "Guide local arabophone"
        ],
        pricing: {
            triple: 209000,
            double: 215000,
            single: 265000,
            child_under4: 109000,
            child_under12: 175000,
            second_child: 185000,
            infant: 35000,
            currency: "DA"
        },
        keyAttractions: [
            "Bakou - capitale moderne UNESCO",
            "Gabala - montagnes du Caucase",
            "Sheki - Palais du Khan",
            "Shahdag - complexe de loisirs"
        ],
        itinerary: [
            {day: 1, title: "Arrivée à Bakou & tour panoramique"},
            {day: 2, title: "Absheron & Bakou"},
            {day: 3, title: "Bakou - Gabala"},
            {day: 4, title: "Gabala - téléphérique et nature"},
            {day: 5, title: "Excursion à Sheki"},
            {day: 6, title: "Gabala - Bakou"},
            {day: 7, title: "Shahdag"},
            {day: 8, title: "Départ"}
        ]
    },
    {
        id: 2,
        name: "Liban",
        image_url: "/images/destinations/beirout.webp",
        mainCities: ["Beyrouth"],
        duration: {
            days: 8,
            nights: 7
        },
        departureFrom: "Alger",
        airline: "Air Algérie",
        flightDetails: {
            outbound: {departure: "08:00", arrival: "13:00"},
            return: {departure: "15:20", arrival: "17:50"},
            type: "Vol direct"
        },
        highlights: [
            "Vols directs optimaux",
            "Hôtels 100% garantis",
            "4 journées complètes de visites guidées",
            "Guides francophones & arabophones"
        ],
        accommodation: [
            {hotel: "Vanda Boutique & Spa", stars: 4, nights: 7},
            {hotel: "Portaluna Hotel & Resort", stars: 5, nights: 7}
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Vols aller-retour Air Algérie",
            "Hébergement 7 nuits",
            "Petit-déjeuner quotidien",
            "Transferts aéroport ↔ hôtel",
            "4 journées de visites guidées",
            "Bus climatisé",
            "Guides francophones & arabophones",
            "Assistance permanente"
        ],
        notIncluded: [
            "Visa: 8$ à l'arrivée",
            "Déjeuners et dîners",
            "Tickets d'entrée aux sites"
        ],
        departureDates: [
            {outbound: "23/12/2025", return: "30/12/2025"},
            {outbound: "02/01/2026", return: "09/01/2026"},
            {outbound: "16/01/2026", return: "23/01/2026"}
        ],
        pricing: {
            hotel4Star: {
                name: "Vanda Boutique & Spa 4*",
                double: 139000,
                triple: 139000,
                single: 200000,
                infant: 25000,
                child_2to4: 88000,
                child_5to11: 125000
            },
            hotel5Star: {
                name: "Portaluna Hotel & Resort 5*",
                double: 175000,
                triple: 175000,
                single: 245000,
                child_5to11: 139000
            },
            currency: "DA"
        },
        keyAttractions: [
            "Grotte de Jeita",
            "Harissa en téléphérique",
            "Byblos et Batroun",
            "Tripoli",
            "Palais de Beiteddine"
        ],
        itinerary: [
            {day: 1, title: "Arrivée à Beyrouth"},
            {day: 2, title: "Musées, Grotte de Jeita, Harissa"},
            {day: 3, title: "Byblos et Batroun"},
            {day: 4, title: "Journée libre"},
            {day: 5, title: "Tripoli"},
            {day: 6, title: "Beyrouth et Chouf"},
            {day: 7, title: "Journée libre"},
            {day: 8, title: "Départ"}
        ]
    },
    {
        id: 3,
        name: "Turquie",
        image_url: "/images/destinations/istanbull.webp",
        mainCities: ["Istanbul"],
        duration: {
            days: 8,
            nights: 7
        },
        departureFrom: "Constantine",
        airline: "Turkish Airlines",
        flightDetails: {
            type: "Aller-retour"
        },
        highlights: [
            "Meilleure offre à partir de 120 000 DA",
            "4 journées complètes d'excursions touristiques",
            "Départ de Constantine"
        ],
        accommodation: [
            {hotel: "NL Amsterdam", stars: 3, nights: 7},
            {hotel: "Ozer Palace", stars: 4, nights: 7},
            {hotel: "Ramada Plaza Sultanahmet", stars: 5, nights: 7}
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billet d'avion Turkish Airlines",
            "Transferts aéroport/hôtel/aéroport",
            "Hébergement selon formule choisie",
            "Petit-déjeuner quotidien",
            "4 journées d'excursions touristiques"
        ],
        notIncluded: ["Visa"],
        visaInfo: "Dossier à déposer auprès du centre Gateway",
        departureDates: [
            {outbound: "08/01/2026", return: "15/01/2026"},
            {outbound: "15/01/2026", return: "22/01/2026"},
            {outbound: "22/01/2026", return: "29/01/2026"},
            {outbound: "24/01/2026", return: "31/01/2026"},
            {outbound: "29/01/2026", return: "05/02/2026"},
            {outbound: "05/02/2026", return: "12/02/2026"},
            {outbound: "07/02/2026", return: "14/02/2026"},
            {outbound: "09/02/2026", return: "16/02/2026"}
        ],
        pricing: {
            hotel3Star: {
                name: "NL Amsterdam 3★",
                double: 120000,
                single: 159000,
                child_6to12: 99000,
                child_2to5: 79000,
                infant: 25000
            },
            hotel4Star: {
                name: "Ozer Palace 4★",
                double: 128000,
                single: 166000,
                child_6to12: 105000,
                child_2to5: 80000,
                infant: 25000
            },
            hotel5Star: {
                name: "Ramada Plaza Sultanahmet 5★",
                double: 149000,
                single: 208000,
                child_6to12: 115000,
                child_2to5: 85000,
                infant: 25000
            },
            currency: "DA"
        },
        keyAttractions: [
            "Mosquée Bleue",
            "Sainte-Sophie",
            "Grand Bazar",
            "Croisière Îles des Princes",
            "Palais de Beylerbeyi",
            "Partie asiatique"
        ],
        itinerary: [
            {day: 1, title: "Arrivée et installation"},
            {day: 2, title: "City tour - Mosquée Bleue, Sainte-Sophie, Grand Bazar"},
            {day: 3, title: "Croisière Îles des Princes"},
            {day: 4, title: "Ortaköy et centres commerciaux"},
            {day: 5, title: "Partie asiatique - Beylerbeyi, Üsküdar"},
            {day: 6, title: "Journée libre"},
            {day: 7, title: "Journée libre"},
            {day: 8, title: "Départ"}
        ]
    },
    {
        id: 4,
        name: "Russia",
        image_url: "/images/destinations/moscow.jpg",
        mainCities: ["Moscou"],
        duration: {
            days: 8,
            nights: 7
        },
        departureFrom: "Alger",
        airline: "Air Algérie",
        flightDetails: {
            type: "Vol direct"
        },
        highlights: [
            "Vol direct avec Air Algérie",
            "Hôtel 4 étoiles",
            "4 jours d'excursions incluses",
            "Guide francophone local"
        ],
        accommodation: [
            {hotel: "IZMAILOVO VEGA", stars: 4, nights: 7}
        ],
        mealPlan: "Petit déjeuner",
        included: [
            "Billet d'avion aller-retour vol direct",
            "Hébergement 7 nuitées",
            "Transferts aéroport-hôtel-aéroport",
            "Assistance à l'aéroport",
            "Guide francophone local",
            "Toutes taxes de séjour",
            "4 jours d'excursions"
        ],
        visaInfo: {
            supplement: 15000,
            description: "Frais de visa + assurance voyage",
            documents: [
                "Passeport (validité 6 mois)",
                "2 photos",
                "Attestation de travail ou registre de commerce",
                "Relevé de compte (min 1500 EUR / 300 000 DA)"
            ]
        },
        departureDates: [
            {outbound: "16/01/2026"}
        ],
        pricing: {
            hotel4Star: {
                name: "IZMAILOVO VEGA 4 étoiles",
                double: 199000,
                triple: 199000,
                single: 249000,
                infant: 35000,
                child_2to4: 119000,
                child_5to11: 169000
            },
            currency: "DA",
            notes: "Chambres triples = doubles avec lit d'appoint. Supplément visa: 15 000 DA"
        },
        keyAttractions: [
            "Métro de Moscou",
            "Rue Arbat",
            "Cathédrale du Christ-Sauveur",
            "Place Rouge",
            "GUM",
            "Parc VDNKh",
            "Musée de l'espace",
            "Izmailovo Kremlin"
        ],
        itinerary: [
            {day: 1, title: "Arrivée et installation"},
            {day: 2, title: "Métro de Moscou et rue Arbat"},
            {day: 3, title: "Tour en bus - Cathédrale, Université, Moskva City"},
            {day: 4, title: "Place Rouge, GUM, shopping"},
            {day: 5, title: "VDNKh, Musée de l'espace, Izmailovo Kremlin"},
            {day: 6, title: "Journée libre"},
            {day: 7, title: "Journée libre"},
            {day: 8, title: "Départ"}
        ]
    },
    {
        id: 5,
        name: "Égypte - Sharm El Sheikh & Le Caire",
        image_url: "/images/destinations/sharm.jpg",
        mainCities: ["Sharm El Sheikh", "Le Caire"],
        duration: {
            days: 8,
            nights: 7
        },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: {
            type: "Vols internationaux et domestiques"
        },
        highlights: [
            "5 nuits à Sharm El Sheikh en All Inclusive Soft",
            "2 nuits au Caire avec excursions",
            "Dîner-croisière sur le Nil avec spectacle",
            "Lettre de garantie pour le visa incluse"
        ],
        accommodation: [
            {location: "Sharm El Sheikh", hotel: "Virginia Aqua Park", stars: 4, nights: 5},
            {location: "Sharm El Sheikh", hotel: "Rehana Aqua Park", stars: 4, nights: 5},
            {location: "Sharm El Sheikh", hotel: "Rehana Royal Beach", stars: 5, nights: 5},
            {location: "Sharm El Sheikh", hotel: "Charmillion Club Aqua Park", stars: 5, nights: 5},
            {location: "Sharm El Sheikh", hotel: "Charmillion Club Resort", stars: 5, nights: 5},
            {location: "Le Caire", nights: 2}
        ],
        mealPlan: "All Inclusive Soft à Sharm / Petit déjeuner au Caire",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Lettre de garantie pour le visa",
            "Transferts aéroport-hôtel-aéroport",
            "Hébergement 5 nuits Sharm (All Inclusive Soft)",
            "Hébergement 2 nuits Le Caire (Petit déjeuner)",
            "Excursions à Sharm El Sheikh",
            "Excursions au Caire",
            "Dîner-croisière sur le Nil avec spectacle"
        ],
        notIncluded: [
            "Visa: 25 USD à payer à l'arrivée au Caire",
            "Nouveau Musée Égyptien (en option)"
        ],
        departureDates: [
            {outbound: "16/01/2026"},
            {outbound: "23/01/2026"},
            {outbound: "01/02/2026"}
        ],
        pricing: {
            hotel4Star: {
                name: "Virginia Aqua Park 4★",
                double: 184000,
                triple: 182000,
                single: 220000,
                first_child: 115000,
                second_child: 145000,
                infant: 25000
            },
            hotel5Star: {
                name: "Rehana Royal Beach 5★",
                double: 222000,
                triple: 220000,
                single: 265000,
                first_child: 115000,
                second_child: 165000,
                infant: 25000
            },
            currency: "DA",
            notes: "Check-in à 14h00. Capacité chambres: 4 personnes max (2 adultes + 2 enfants)"
        },
        keyAttractions: [
            "Naama Bay",
            "Old Market Sharm",
            "Mosquée Sahaba",
            "Soho Square",
            "Pyramides & Sphinx",
            "Khan El Khalili",
            "Mosquées Al-Azhar & Al-Hussein",
            "Croisière sur le Nil"
        ],
        itinerary: [
            {day: 1, title: "Arrivée à Sharm El Sheikh"},
            {day: 2, title: "Naama Bay et Old Market"},
            {day: 3, title: "Mosquée Sahaba et Soho Square"},
            {day: 4, title: "Détente à Sharm El Sheikh"},
            {day: 5, title: "Journée libre à Sharm"},
            {day: 6, title: "Transfer au Caire - Pyramides & Sphinx"},
            {day: 7, title: "Khan El Khalili, Mosquées, Dîner-croisière Nil"},
            {day: 8, title: "Départ"}
        ]
    },
    {
        id: 6,
        name: "Égypte - Croisière Louxor & Assouane",
        image_url: "/images/destinations/nile-cruise.jpg",
        mainCities: ["Le Caire", "Assouane", "Louxor", "Hurghada"],
        duration: {
            days: 9,
            nights: 9
        },
        departureFrom: "Alger",
        airline: "EgyptAir",
        flightDetails: {
            type: "Vols internationaux et domestiques"
        },
        highlights: [
            "Croisière 5★ sur le Nil pendant 3 nuits",
            "Découverte de 4 villes emblématiques",
            "Programme culturel enrichi",
            "3 nuits All Inclusive à Hurghada"
        ],
        accommodation: [
            {location: "Le Caire", hotel: "Marwa Palace", stars: 4, nights: 2},
            {location: "Assouane", hotel: "Gloria Aqua Park", stars: 4, nights: 1},
            {location: "Croisière Nil", hotel: "M/S Semiramis III", stars: 5, nights: 3},
            {location: "Hurghada", hotel: "Amwaj Oyoun Club Resort", stars: 4, nights: 3}
        ],
        mealPlan: "Petit déjeuner au Caire/Assouane, Pension complète en croisière, All Inclusive Soft à Hurghada",
        included: [
            "Vols internationaux et domestiques EgyptAir",
            "Tous les transferts aéroport-hôtel-aéroport",
            "Transferts inter-villes (Louxor → Hurghada)",
            "Lettre de garantie pour le visa",
            "Hébergement selon programme",
            "Excursions complètes dans les 4 villes",
            "Entrées et billets des sites inclus"
        ],
        notIncluded: [
            "Visa: 25 USD à payer à l'arrivée au Caire",
            "Boissons durant la croisière",
            "Activités optionnelles à Hurghada (plongée, safari, spectacle dauphins)"
        ],
        pricing: {
            double: 275000,
            triple: 275000,
            single: 390000,
            first_child: 165000,
            second_child: 215000,
            infant: 25000,
            currency: "DA"
        },
        keyAttractions: [
            "Pyramides & Sphinx",
            "Khan El Khalili",
            "Kom Ombo & Musée des Crocodiles",
            "Haut Barrage d'Assouane",
            "Temple de Philae",
            "Île Nubienne",
            "Temple de Karnak",
            "Temple de Louxor",
            "Vallée des Rois",
            "Temple de la Reine Hatshepsout",
            "Colosses de Memnon",
            "Marina Port Hurghada"
        ],
        itinerary: [
            {day: 1, title: "Arrivée au Caire"},
            {day: 2, title: "Pyramides, Sphinx, Khan El Khalili, Mosquées"},
            {day: 3, title: "Vol vers Assouane - Kom Ombo, Haut Barrage"},
            {day: 4, title: "Temple de Philae, Île Nubienne, embarquement croisière"},
            {day: 5, title: "Navigation sur le Nil"},
            {day: 6, title: "Louxor - Karnak, Vallée des Rois, Hatshepsout"},
            {day: 7, title: "Transfert à Hurghada"},
            {day: 8, title: "Hurghada - Marina Port et détente"},
            {day: 9, title: "Journée libre à Hurghada"},
            {day: 10, title: "Départ"}
        ]
    }
];

const E_VisaData = [
    {
        country: "Armenia",
        flagUrl: "/images/flags/flag-armenia.jpg",
        durationMode: {
            duration: ["21 Jours", "120 Jours"],
            price: [8500, 18500]
        },
        processingTime: "6-11 jours ouvrables",
        description: "E-Visa ARMENIA 21 Jours - 8.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source), billet TLX.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet TLX"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Azerbaijan",
        flagUrl: "/images/flags/flag-azerbaijan.jpg",
        price: "14.000,00 DZD",
        duration: "30 jours",
        processingTime: "5-8 jours",
        description: "Visa Azerbaïdjan 30 jrs - 14.000,00 DZD / 1 Personne. Dossier à fournir: Scan passeport, date exacte du départ.",
        requirements: ["Scan passeport", "Date exacte du départ"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "China",
        flagUrl: "/images/flags/drapeau-de-la-chine.jpg",
        durationMode: {
            duration: ["30 jours"],
            demandeOccurrence: ["Première Demande", "Renouvelement"],
            price: ["15.000,00 DZD", "12.000,00 DZD"]
        },
        processingTime: "environ 10 jours ouvrables",
        description: [
            "Visa Chine Sticker 30 jours 1ere demande - 15.000 DZD. Documents nécessaires: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, relevé bancaire récent (minimum 3.000€) avec cachet de la banque, casier judiciaire récent. Validité: 30 jours, une seule entrée.",
            "Visa Chine Sticker 30 jours renouvellement - 12.000 DZD. Documents nécessaires: Scan passeport, 1 photo Full HD, numéro de téléphone, attestation de travail ou RC, Copie du visa avec cachet d'entrée et de sortie, casier judiciaire récent."
        ],
        requirementsByDemande: {
            "Première Demande": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Relevé bancaire récent (minimum 3.000€)",
                "Casier judiciaire"
            ],
            "Renouvelement": [
                "Scan passeport",
                "1 photo Full HD",
                "Numéro de téléphone",
                "Attestation de travail ou RC",
                "Copie du visa avec cachet d'entrée et de sortie",
            ]
        },
        constraints: "Le demandeur doit être présent le jour du dépôt du dossier. L'agence n'assume aucune responsabilité si le client achète son billet d'avion avant l'obtention du visa. Frais consulaires non inclus. À partir du 1er août 2025, les paiements en espèces ne seront plus acceptés (uniquement cartes bancaires algériennes via TPE). Merci d'envoyer le dossier au moins un mois avant la date de départ."
    },
    {
        country: "Egypt",
        flagUrl: "/images/flags/drapeau-de-l-egypte.jpg",
        price: "2.500,00 DZD",
        duration: "30 jours",
        processingTime: "24H à 48H",
        description: "Lettre de garantie Egypte - 2.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan billet pour le Caire ou Charm el cheikh.",
        requirements: ["Scan passeport", "Scan billet pour le Caire ou Charm el cheikh"],
        constraints: "N/A"
    },
    {
        country: "Indonesia",
        flagUrl: "/images/flags/drapeau-de-l-indonesie.jpg",
        price: "29.000,00 DZD",
        duration: "60 jours",
        processingTime: "8-10 jours ouvrables",
        description: "E-Visa Indonésie 60 jours - 29.000,00 DZD / 1 Personne. Dossier: Scan passeport, fichier source d'une photo (à demander au photographe).",
        requirements: ["Scan passeport", "Fichier source d'une photo (à demander au photographe)"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Lebanon",
        flagUrl: "/images/flags/flag-lebanon.jpg",
        price: "21.000,00 DZD",
        duration: "30 jours",
        processingTime: "9 jours ouvrables",
        description: "Visa Liban Sticker 30 jours - 21.000,00 DZD / 1 Personne. Dossier: Passeport, 2 photo 5*5, un acte de naissance, une attestation de travail ou REG.C, un relevé de compte bancaire min 1500 euro. Le dossier doit être envoyé à l'agence Bright Sky Tour AIN BEIDA.",
        requirements: ["Passeport", "2 photo 5*5", "Acte de naissance", "Attestation de travail ou REG.C", "Relevé de compte bancaire min 1500 euro"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Oman",
        flagUrl: "/images/flags/drapeau-d-oman.jpg",
        durationMode: {
            duration: ["30 Jours", "10 Jours", "30 Jours Prolongation"],
            price: ["22.000,00 DZD", "14.500,00 DZD", "35.000,00 DZD"]
        },
        processingTime: "4-8 jours ouvrables",
        description: [
            "E-Visa Oman 30 jours - 22.000,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source). Le client aura 8 jours seulement pour partir à OMAN (à compter de la date d'effet de son VISA).",
            "E-Visa Oman 10 jours - 14.500,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source). Le client aura 8 jours seulement pour partir à OMAN (à compter de la date d'effet de son VISA).",
            "E-Visa Oman 30 jours Prolongation - 35.000,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source), Scan visa. Le client aura 8 jours seulement pour partir à OMAN (à compter de la date d'effet de son VISA)."
        ],
        requirementsByDemande: {
            "30 Jours": ["Scan passeport", "Scan photo (fichier source)"],
            "10 Jours": ["Scan passeport", "Scan photo (fichier source)"],
            "30 Jours Prolongation": ["Scan passeport", "Scan photo (fichier source)", "Scan visa"]
        },
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. Le client aura 8 jours seulement pour partir à OMAN (à compter de la date d'effet de son VISA). MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Qatar",
        flagUrl: "/images/flags/drapeau-du-qatar.jpg",
        price: "20.000,00 DZD",
        duration: "30 jours",
        processingTime: "3-6 jours ouvrables",
        description: "E-Visa Qatar 30 jours touristique - 9.500,00 DZD / 1 Personne. Visa sans assurance (l'assurance est souvent demandée à l'aéroport). Dossier: Scan passeport, fichier source photo (à demander du photographe), merci de créer une adresse mail et de l'envoyer avec le mot de passe.",
        requirements: ["Scan passeport", "Fichier source photo", "Adresse mail avec mot de passe"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. Merci de ne pas ouvrir les emails pendant la durée du traitement pour éviter tout problème. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Tanzania",
        flagUrl: "/images/flags/flag-tanzania.jpg",
        price: "20.000,00 DZD",
        duration: "30 jours",
        processingTime: "7 jours ouvrables",
        description: "E-Visa Tanzanie (Zanzibar) 30 jours - 20.000,00 DZD / 1 Personne. Dossier: Scan passeport, scan photo (fichier source), billet non confirmé.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet non confirmé"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Thailand",
        flagUrl: "/images/flags/drapeau-de-la-thailande.jpg",
        price: "19.000,00 DZD",
        duration: "60 jours",
        processingTime: "30 jours ouvrables",
        description: "E-Visa Thailande 60 jours - 19.000,00 DZD / 1 Personne. Dossier: Scan du passeport en cours de validité (en JPEG), photo avec fond blanc fichier source du photographe, une attestation de travail ou RC, une résidence moins de 2 mois en Français et en arabe, relevé de compte 1000 EUR.",
        requirements: ["Scan passeport (JPEG)", "Photo fond blanc (fichier source)", "Attestation de travail ou RC", "Résidence moins de 2 mois (FR + AR)", "Relevé de compte 1000 EUR"],
        constraints: "Les fichiers avec CAM SCAN ne sont pas acceptés. Pour éviter les retards les documents doivent être bien scannés. Le traitement de demande se fera la journée suivante du dépôt et doit être envoyée avant 15h. En cas de refus le visa n'est pas remboursable. Le délai officiel au consulat est un mois, toute demande pour un départ date proche risque d'être refusée. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Turkey",
        flagUrl: "/images/flags/drapeau-de-la-turquie.jpg",
        price: "22.000,00 DZD",
        duration: "B1",
        processingTime: "3 jours ouvrables",
        description: "E-Visa Turquie B1 - 22.000,00 DZD / 1 Personne. Dossier: Scan passeport, visa ou permis de séjour Schengen/UK/USA.",
        requirements: ["Scan passeport", "Visa ou permis de séjour Schengen/UK/USA"],
        constraints: "Visa disponible pour les personnes âgées de plus de 35 ans. Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    },
    {
        country: "Vietnam",
        flagUrl: "/images/flags/flag-vietnam.jpg",
        price: "19.500,00 DZD",
        duration: "30 jours",
        processingTime: "6-11 jours ouvrables",
        description: "E-Visa Vietnam 30 jours - 19.500,00 DZD / 1 Personne. Dossier d'inscription: Scan passeport, scan photo (fichier source), billet d'avion. En cas de fermeture du consulat ou de blocage du système, le délai de traitement sera automatiquement allongé.",
        requirements: ["Scan passeport", "Scan photo (fichier source)", "Billet d'avion"],
        constraints: "Pour éviter les retards les documents doivent être bien scannés. Les refus des visas sont NON REMBOURSABLES, le client doit payer les frais. La demande doit être envoyée avant 15h. Le client doit respecter le délai de son visa pour éviter les problèmes. MERCI DE VÉRIFIER TOUTE LES INFORMATION DANS LE VISA UNE FOIS REÇU, NOTRE AGENCE N' EST PAS RESPONSABLE DE PROBLÈME DE FAUTE NON RÉCLAMÉ"
    }
];

export {carouselImages, hotelOfferCards, testimonials, destinations, E_VisaData};
