/**
 * Curated Bengaluru Real Estate Dataset
 * Provides real Bengaluru micro-markets, localities, and known apartment complexes.
 */

export interface LocalityItem {
  id: string;
  name: string;
  zone: 'East' | 'South' | 'North' | 'West' | 'Central';
  popularSubLocalities?: string[];
}

export interface SocietyItem {
  id: string;
  name: string;
  locality: string;
  zone: string;
  builder: string;
}

export const BENGALURU_LOCALITIES: LocalityItem[] = [
  { id: 'whitefield', name: 'Whitefield', zone: 'East', popularSubLocalities: ['ITPL', 'Hope Farm', 'ECC Road', 'Channasandra', 'Kadugodi'] },
  { id: 'sarjapur-road', name: 'Sarjapur Road', zone: 'East', popularSubLocalities: ['Carmelaram', 'Kaikondrahalli', 'Doddakannelli', 'Somapura'] },
  { id: 'hsr-layout', name: 'HSR Layout', zone: 'South', popularSubLocalities: ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 6', 'Sector 7'] },
  { id: 'bellandur', name: 'Bellandur', zone: 'East', popularSubLocalities: ['Green Glen Layout', 'Outer Ring Road', 'Kariyammana Agrahara'] },
  { id: 'hebbal', name: 'Hebbal', zone: 'North', popularSubLocalities: ['Hebbal Kempapura', 'Kempapura Main Road', 'Cholanayakanahalli'] },
  { id: 'indiranagar', name: 'Indiranagar', zone: 'Central', popularSubLocalities: ['100 Feet Road', '12th Main', 'Defence Colony', 'HAL 2nd Stage'] },
  { id: 'koramangala', name: 'Koramangala', zone: 'South', popularSubLocalities: ['3rd Block', '4th Block', '5th Block', '6th Block', '8th Block'] },
  { id: 'electronic-city-1', name: 'Electronic City Phase 1', zone: 'South', popularSubLocalities: ['Neeladri Road', 'Wipro Gate', 'Celebrity Paradise'] },
  { id: 'electronic-city-2', name: 'Electronic City Phase 2', zone: 'South', popularSubLocalities: ['Tech Mahindra Road', 'Ananth Nagar'] },
  { id: 'jayanagar', name: 'Jayanagar', zone: 'South', popularSubLocalities: ['3rd Block', '4th Block', '7th Block', '9th Block'] },
  { id: 'jp-nagar', name: 'JP Nagar', zone: 'South', popularSubLocalities: ['Phase 1', 'Phase 2', 'Phase 5', 'Phase 7', 'Phase 8'] },
  { id: 'thanisandra', name: 'Thanisandra', zone: 'North', popularSubLocalities: ['Thanisandra Main Road', 'Bhartiya City', 'Ashwath Nagar', 'Nagawara'] },
  { id: 'jakkur', name: 'Jakkur', zone: 'North', popularSubLocalities: ['Jakkur Plantation', 'Aerodrome Road', 'Agrahara', 'Nehru Nagar'] },
  { id: 'hennur', name: 'Hennur', zone: 'North', popularSubLocalities: ['Hennur Road', 'Hennur Cross', 'Geddalahalli', 'Bio-tech Corridor'] },
  { id: 'bannerghatta-road', name: 'Bannerghatta Road', zone: 'South', popularSubLocalities: ['Arekere', 'Hulimavu', 'Gottigere', 'Meenakshi Mall'] },
  { id: 'kanakapura-road', name: 'Kanakapura Road', zone: 'South', popularSubLocalities: ['Konanakunte Cross', 'Thalaghattapura', 'Vajarahalli'] },
  { id: 'marathahalli', name: 'Marathahalli', zone: 'East', popularSubLocalities: ['ORR Junction', 'Spice Garden', 'Munnekollal'] },
  { id: 'yelahanka', name: 'Yelahanka', zone: 'North', popularSubLocalities: ['Yelahanka New Town', 'Judicial Layout', 'Kogilu Cross'] },
  { id: 'malleshwaram', name: 'Malleshwaram', zone: 'West', popularSubLocalities: ['8th Cross', '18th Cross', 'Margosa Road', 'Sampige Road'] },
  { id: 'btm-layout', name: 'BTM Layout', zone: 'South', popularSubLocalities: ['BTM 1st Stage', 'BTM 2nd Stage', 'Mico Layout'] },
  { id: 'varthur', name: 'Varthur', zone: 'East', popularSubLocalities: ['Gunjur Road', 'Varthur Kodi', 'Balagere Road'] },
  { id: 'panathur', name: 'Panathur', zone: 'East', popularSubLocalities: ['Balagere', 'Panathur Main Road', 'Kaveri Nagar'] },
  { id: 'kadubeesanahalli', name: 'Kadubeesanahalli', zone: 'East', popularSubLocalities: ['Prestige Tech Park Road', 'ORR'] },
  { id: 'kasavanahalli', name: 'Kasavanahalli', zone: 'South', popularSubLocalities: ['Jail Road', 'Central Jail Road', 'Owners Court'] },
  { id: 'mahadevapura', name: 'Mahadevapura', zone: 'East', popularSubLocalities: ['RHB Colony', 'Maheshwari Nagar', 'Garudacharpalya'] },
  { id: 'brookefield', name: 'Brookefield', zone: 'East', popularSubLocalities: ['ITPL Main Road', 'AECS Layout', 'Kundalahalli Gate'] },
  { id: 'hoodi', name: 'Hoodi', zone: 'East', popularSubLocalities: ['Hoodi Circle', 'Kodigehalli', 'Seetharampalya'] },
  { id: 'domlur', name: 'Domlur', zone: 'Central', popularSubLocalities: ['Domlur 2nd Stage', 'EGL Corridor', 'Wind Tunnel Road'] },
  { id: 'cv-raman-nagar', name: 'CV Raman Nagar', zone: 'East', popularSubLocalities: ['Kaggadasapura', 'Nagavarapalya', 'DRDO Phase 1'] },
  { id: 'banashankari', name: 'Banashankari', zone: 'South', popularSubLocalities: ['BSK 2nd Stage', 'BSK 3rd Stage', 'Girinagar', 'Kathriguppe'] },
  { id: 'rajajinagar', name: 'Rajajinagar', zone: 'West', popularSubLocalities: ['1st Block', '2nd Block', 'Dr. Rajkumar Road', 'Bashyam Circle'] },
  { id: 'basavanagudi', name: 'Basavanagudi', zone: 'South', popularSubLocalities: ['Gandhi Bazaar', 'Bull Temple Road', 'NR Colony'] },
  { id: 'richmond-town', name: 'Richmond Town', zone: 'Central', popularSubLocalities: ['Richmond Road', 'Langford Town', 'Museum Road'] },
  { id: 'sadashivanagar', name: 'Sadashivanagar', zone: 'Central', popularSubLocalities: ['Sankey Tank', 'Upper Palace Orchards', 'Bellary Road'] },
  { id: 'hennur-road', name: 'Hennur Road', zone: 'North', popularSubLocalities: ['Hennur Cross', 'Geddalahalli', 'Bio-tech Corridor', 'Kothanur'] },
  { id: 'devanahalli', name: 'Devanahalli', zone: 'North', popularSubLocalities: ['Aerospace Park', 'KIADB Corridor', 'Airport Road', 'Shettigere'] },
  { id: 'kalyan-nagar', name: 'Kalyan Nagar', zone: 'North', popularSubLocalities: ['HRBR Layout', 'CMR Road', 'Banaswadi', 'Kammanahalli'] },
  { id: 'harlur-road', name: 'Harlur Road / Haralur', zone: 'South', popularSubLocalities: ['Silver County Road', 'Kaikondrahalli Junction', 'Reliable Tranquil'] },
  { id: 'kudlu-gate', name: 'Kudlu Gate', zone: 'South', popularSubLocalities: ['Kudlu', 'Hosapalaya', 'Hosa Road Junction'] },
  { id: 'singasandra', name: 'Singasandra', zone: 'South', popularSubLocalities: ['Manipal County Road', 'Begur Hub', 'Hosur Main Road'] },
  { id: 'hosa-road', name: 'Hosa Road', zone: 'South', popularSubLocalities: ['Jail Road Junction', 'Central Jail Road', 'Kasavanahalli Link'] },
  { id: 'begur-road', name: 'Begur Road', zone: 'South', popularSubLocalities: ['Begur Lake', 'Vishwapriya Nagar', 'DLF New Town Area'] },
  { id: 'bommanahalli', name: 'Bommanahalli', zone: 'South', popularSubLocalities: ['Virat Nagar', 'Roopena Agrahara', 'Silk Board Corridor'] },
  { id: 'kr-puram', name: 'KR Puram', zone: 'East', popularSubLocalities: ['Old Madras Road', 'TC Palya Road', 'Hanging Bridge Corridor', 'Bhattarahalli'] },
  { id: 'ramamurthy-nagar', name: 'Ramamurthy Nagar', zone: 'East', popularSubLocalities: ['Kalkere', 'Horamavu Main Road', 'B Channasandra'] },
  { id: 'horamavu', name: 'Horamavu', zone: 'North', popularSubLocalities: ['Horamavu Agara', 'Babusapalya', 'Jayanthi Nagar'] },
  { id: 'banaswadi', name: 'Banaswadi', zone: 'East', popularSubLocalities: ['OMBR Layout', 'Chikka Banaswadi', 'Subbaiahnapalya'] },
  { id: 'kasturi-nagar', name: 'Kasturi Nagar', zone: 'East', popularSubLocalities: ['B Channasandra', 'Outer Ring Road Kasturi Nagar', 'Pai Layout'] },
  { id: 'frazer-town', name: 'Frazer Town / Pulikeshi Nagar', zone: 'Central', popularSubLocalities: ['Coles Road', 'Mosque Road', 'MM Road', 'Cox Town'] },
  { id: 'benson-town', name: 'Benson Town', zone: 'Central', popularSubLocalities: ['Nandidurga Road', 'Harris Road', 'Jaymahal Extension'] },
  { id: 'ulsoor', name: 'Ulsoor / Halasuru', zone: 'Central', popularSubLocalities: ['Someshwara Temple Road', 'Ulsoor Lake', 'Old Madras Road'] },
  { id: 'vasanth-nagar', name: 'Vasanth Nagar', zone: 'Central', popularSubLocalities: ['Palace Road', 'Millers Road', 'Cunningham Road'] },
  { id: 'yeshwanthpur', name: 'Yeshwanthpur', zone: 'West', popularSubLocalities: ['APMC Yard', 'Goraguntepalya', 'Tumkur Road Flyover'] },
  { id: 'peenya', name: 'Peenya', zone: 'West', popularSubLocalities: ['Peenya 1st Stage', 'Peenya 2nd Stage', 'Jalahalli Cross'] },
  { id: 'vijayanagar', name: 'Vijayanagar', zone: 'West', popularSubLocalities: ['RPC Layout', 'Chord Road', 'Hosahalli Metro Station'] },
  { id: 'kengeri', name: 'Kengeri / Kengeri Satellite Town', zone: 'West', popularSubLocalities: ['Kommaghatta', 'Mysore Road Metro', 'Ullal'] },
  { id: 'uttarahalli', name: 'Uttarahalli', zone: 'South', popularSubLocalities: ['Chikkallasandra', 'Poornapragna Layout', 'Subramanyapura'] },
  { id: 'rr-nagar', name: 'Rajarajeshwari Nagar (RR Nagar)', zone: 'West', popularSubLocalities: ['Ideal Homes Layout', 'BEML Layout', 'BHEL Layout'] },
  { id: 'sahakara-nagar', name: 'Sahakara Nagar', zone: 'North', popularSubLocalities: ['F Block', 'G Block', 'CQAL Layout', 'Kodigehalli Gate'] },
  { id: 'vidyaranyapura', name: 'Vidyaranyapura', zone: 'North', popularSubLocalities: ['BEL Layout', 'Thindlu', 'Doddabommasandra'] },
  { id: 'bagalur', name: 'Bagalur / KIADB Aerospace', zone: 'North', popularSubLocalities: ['Aerospace Park', 'Hardware Park', 'Razack Palya'] },
  { id: 'kogilu', name: 'Kogilu / Kogilu Cross', zone: 'North', popularSubLocalities: ['Prakruthi Nagar', 'Maruthi Nagar', 'Yelahanka Extension'] },
  { id: 'budigere-cross', name: 'Budigere Cross / OMR Corridor', zone: 'East', popularSubLocalities: ['Mandur', 'Konadasapura', 'Old Madras Road Junction'] },
  { id: 'gunjur', name: 'Gunjur / Varthur', zone: 'East', popularSubLocalities: ['Gunjur Palya', 'Chrysalis High Corridor', 'Balagere Link'] },
  { id: 'carmelaram', name: 'Carmelaram / Doddakannelli', zone: 'East', popularSubLocalities: ['Carmelaram Station Road', 'Decathlon Corridor', 'Chikka Bellandur'] },
  { id: 'kadugodi', name: 'Kadugodi', zone: 'East', popularSubLocalities: ['Kadugodi Tree Park', 'Belathur', 'Channasandra Main Road', 'Hope Farm Junction'] },
  { id: 'kammanahalli', name: 'Kammanahalli', zone: 'North', popularSubLocalities: ['Nehru Road', 'Kullappa Circle', 'Kammanahalli Main Road', 'Ramaiah Layout'] }
];

export const BENGALURU_SOCIETIES: SocietyItem[] = [
  { id: 'soc-1', name: 'Prestige Shantiniketan', locality: 'Whitefield', zone: 'East', builder: 'Prestige Group' },
  { id: 'soc-2', name: 'Prestige Falcon City', locality: 'Kanakapura Road', zone: 'South', builder: 'Prestige Group' },
  { id: 'soc-3', name: 'Prestige Lakeside Habitat', locality: 'Varthur', zone: 'East', builder: 'Prestige Group' },
  { id: 'soc-4', name: 'Prestige Golfshire', locality: 'Devanahalli', zone: 'North', builder: 'Prestige Group' },
  { id: 'soc-5', name: 'Prestige Jindal City', locality: 'Tumkur Road', zone: 'West', builder: 'Prestige Group' },
  { id: 'soc-6', name: 'Prestige Park Grove', locality: 'Whitefield', zone: 'East', builder: 'Prestige Group' },
  { id: 'soc-7', name: 'Prestige Sunrise Park', locality: 'Electronic City Phase 1', zone: 'South', builder: 'Prestige Group' },
  { id: 'soc-8', name: 'Prestige Ferns Residency', locality: 'Harlur Road', zone: 'South', builder: 'Prestige Group' },
  { id: 'soc-9', name: 'Prestige Kew Gardens', locality: 'Bellandur / Yemalur', zone: 'East', builder: 'Prestige Group' },
  { id: 'soc-9b', name: 'Prestige Elysian', locality: 'Bannerghatta Road', zone: 'South', builder: 'Prestige Group' },
  { id: 'soc-9c', name: 'Prestige Primrose Hills', locality: 'Kanakapura Road', zone: 'South', builder: 'Prestige Group' },
  { id: 'soc-9d', name: 'Prestige Misty Waters', locality: 'Hebbal', zone: 'North', builder: 'Prestige Group' },
  { id: 'soc-9e', name: 'Prestige Finsbury Park', locality: 'Bagalur / Aerospace Park', zone: 'North', builder: 'Prestige Group' },
  { id: 'soc-9f', name: 'Prestige Tech Vista', locality: 'Kadubeesanahalli', zone: 'East', builder: 'Prestige Group' },
  
  { id: 'soc-10', name: 'Sobha Dream Acres', locality: 'Panathur', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-11', name: 'Sobha City', locality: 'Thanisandra Main Road', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-12', name: 'Sobha Silicon Oasis', locality: 'Electronic City Phase 1', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-13', name: 'Sobha Royal Pavilion', locality: 'Sarjapur Road', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-14', name: 'Sobha HRC Pristine', locality: 'Jakkur / Hebbal', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-15', name: 'Sobha Palladian', locality: 'Old Airport Road', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-15b', name: 'Sobha Dream Gardens', locality: 'Thanisandra', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-15c', name: 'Sobha Palm Court', locality: 'Yelahanka', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-15d', name: 'Sobha Morzaria Grandeur', locality: 'Bannerghatta Road', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-15e', name: 'Sobha Clovelly', locality: 'Banashankari', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-15f', name: 'Sobha Neopolis', locality: 'Panathur / Marathahalli', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-15g', name: 'Sobha Windsor', locality: 'Whitefield', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-15h', name: 'Sobha Insignia', locality: 'Bellandur', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-15i', name: 'Sobha Forest View', locality: 'Kanakapura Road', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-15j', name: 'Sobha Heritage', locality: 'Banashankari', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-15k', name: 'Sobha Moonstone', locality: 'Hennur Road', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-15l', name: 'Sobha Ruby', locality: 'Tumkur Road', zone: 'West', builder: 'Sobha Limited' },
  { id: 'soc-15m', name: 'Sobha Quartz', locality: 'Outer Ring Road / Bellandur', zone: 'East', builder: 'Sobha Limited' },
  
  { id: 'soc-16', name: 'Salarpuria Sattva Greenage', locality: 'Hosur Road / Bommanahalli', zone: 'South', builder: 'Sattva Group' },
  { id: 'soc-17', name: 'Salarpuria Sattva Magnificia', locality: 'Old Madras Road', zone: 'East', builder: 'Sattva Group' },
  { id: 'soc-18', name: 'Salarpuria Sattva Cadenza', locality: 'Kudlu Gate', zone: 'South', builder: 'Sattva Group' },
  { id: 'soc-19', name: 'Salarpuria Sattva Anugraha', locality: 'Vijayanagar', zone: 'West', builder: 'Sattva Group' },
  { id: 'soc-20', name: 'Salarpuria Sattva Senorita', locality: 'Sarjapur Road', zone: 'East', builder: 'Sattva Group' },
  { id: 'soc-20b', name: 'Salarpuria Sattva Opus', locality: 'Tumkur Road', zone: 'West', builder: 'Sattva Group' },
  { id: 'soc-20c', name: 'Salarpuria Sattva Divinity', locality: 'Mysore Road', zone: 'West', builder: 'Sattva Group' },
  
  { id: 'soc-21', name: 'Brigade Gateway', locality: 'Rajajinagar', zone: 'West', builder: 'Brigade Group' },
  { id: 'soc-22', name: 'Brigade Metropolis', locality: 'Mahadevapura', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-23', name: 'Brigade Meadows', locality: 'Kanakapura Road', zone: 'South', builder: 'Brigade Group' },
  { id: 'soc-24', name: 'Brigade Cornerstone Utopia', locality: 'Varthur', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-25', name: 'Brigade Caladium', locality: 'Hebbal', zone: 'North', builder: 'Brigade Group' },
  { id: 'soc-26', name: 'Brigade Exotica', locality: 'Old Madras Road', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-26b', name: 'Brigade Buena Vista', locality: 'Budigere Cross', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-26c', name: 'Brigade Woods', locality: 'Whitefield', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-26d', name: 'Brigade Northridge', locality: 'Kogilu Road', zone: 'North', builder: 'Brigade Group' },
  { id: 'soc-26e', name: 'Brigade Orchards', locality: 'Devanahalli', zone: 'North', builder: 'Brigade Group' },
  
  { id: 'soc-27', name: 'Godrej Woodsman Estate', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-27b', name: 'Godrej Woodsman', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-28', name: 'Godrej Platinum', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-29', name: 'Godrej Air', locality: 'Whitefield', zone: 'East', builder: 'Godrej Properties' },
  { id: 'soc-30', name: 'Godrej Eternity', locality: 'Kanakapura Road', zone: 'South', builder: 'Godrej Properties' },
  { id: 'soc-31', name: 'Godrej Reflections', locality: 'Sarjapur Road', zone: 'East', builder: 'Godrej Properties' },
  { id: 'soc-31b', name: 'Godrej Park Retreat', locality: 'Sarjapur Road', zone: 'East', builder: 'Godrej Properties' },
  { id: 'soc-31c', name: 'Godrej Aqua', locality: 'Airport Road / Hosahalli', zone: 'North', builder: 'Godrej Properties' },
  
  { id: 'soc-32', name: 'Puravankara Palm Beach', locality: 'Hennur Road', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-33', name: 'Purva Westend', locality: 'Kudlu Gate', zone: 'South', builder: 'Puravankara' },
  { id: 'soc-34', name: 'Purva Venezia', locality: 'Yelahanka', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-35', name: 'Purva Atmosphere', locality: 'Thanisandra Main Road', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-36', name: 'Purva Skydale', locality: 'Sarjapur Road', zone: 'East', builder: 'Puravankara' },
  { id: 'soc-36b', name: 'Purva Zenium', locality: 'Airport Road', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-36c', name: 'Purva Meraki', locality: 'HSR Layout', zone: 'South', builder: 'Puravankara' },
  
  { id: 'soc-37', name: 'Rohan Viti', locality: 'Bellandur', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-38', name: 'Rohan Iksha', locality: 'Bhoganhalli', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-39', name: 'Rohan Jharoka', locality: 'Yemalur / HAL', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-39b', name: 'Rohan Antara', locality: 'Gunjur', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-39c', name: 'Rohan Upavan', locality: 'Hennur Road', zone: 'North', builder: 'Rohan Builders' },
  
  { id: 'soc-40', name: 'Assetz Marq', locality: 'Whitefield', zone: 'East', builder: 'Assetz Property' },
  { id: 'soc-41', name: 'Assetz 63 Degree East', locality: 'Sarjapur Road', zone: 'East', builder: 'Assetz Property' },
  { id: 'soc-41b', name: 'Assetz Sun & Sanctum', locality: 'KR Puram', zone: 'East', builder: 'Assetz Property' },
  
  { id: 'soc-42', name: 'SNN Clermont', locality: 'Hebbal', zone: 'North', builder: 'SNN Estates' },
  { id: 'soc-43', name: 'SNN Raj Serenity', locality: 'Begur Road', zone: 'South', builder: 'SNN Estates' },
  { id: 'soc-43b', name: 'SNN Raj Bay Vista', locality: 'Bilekahalli', zone: 'South', builder: 'SNN Estates' },
  
  { id: 'soc-44', name: 'Total Environment Windmills of Your Mind', locality: 'Whitefield', zone: 'East', builder: 'Total Environment' },
  { id: 'soc-45', name: 'Total Environment The Magic Faraway Tree', locality: 'Kanakapura Road', zone: 'South', builder: 'Total Environment' },
  { id: 'soc-45b', name: 'Total Environment In That Quiet Earth', locality: 'Hennur Road', zone: 'North', builder: 'Total Environment' },
  { id: 'soc-45c', name: 'Total Environment Pursuit of a Radical Rhapsody', locality: 'Whitefield', zone: 'East', builder: 'Total Environment' },
  
  { id: 'soc-46', name: 'Mantri Espana', locality: 'Bellandur', zone: 'East', builder: 'Mantri Developers' },
  { id: 'soc-47', name: 'Mantri Alpyne', locality: 'Banashankari', zone: 'South', builder: 'Mantri Developers' },
  { id: 'soc-48', name: 'SJR Watermark', locality: 'Bellandur', zone: 'East', builder: 'SJR Primecorp' },
  { id: 'soc-48b', name: 'SJR Blue Waters', locality: 'Hosa Road', zone: 'South', builder: 'SJR Primecorp' },
  { id: 'soc-49', name: 'DSR Waterscape', locality: 'Horamavu', zone: 'North', builder: 'DSR Infrastructure' },
  { id: 'soc-50', name: 'Goyal Orchid Whitefield', locality: 'Whitefield', zone: 'East', builder: 'Goyal & Co' },
  { id: 'soc-51', name: 'Shriram Chirping Woods', locality: 'Harlur Road', zone: 'South', builder: 'Shriram Properties' },
  { id: 'soc-52', name: 'Shriram Greenfield', locality: 'Budigere Cross', zone: 'East', builder: 'Shriram Properties' },
  { id: 'soc-53', name: 'Mahaveer Ranches', locality: 'Hosa Road', zone: 'South', builder: 'Mahaveer Group' }
];

/**
 * Ranked Bengaluru locality search:
 * Tier 1: Locality name starts with query (e.g. "w" -> "Whitefield", "kad" -> "Kadugodi", "ka" -> "Kadugodi", "Kammanahalli", "Kanakapura Road", etc.)
 * Tier 2: Word boundary in locality name starts with query
 * Tier 3: Popular sub-localities start with query
 * Tier 4: Substring match anywhere in locality name
 * Tier 5: Substring match in sub-localities or zone
 */
export function searchLocalities(query: string): LocalityItem[] {
  if (!query || query.trim().length === 0) {
    return BENGALURU_LOCALITIES.slice(0, 16);
  }
  const clean = query.toLowerCase().trim();

  const tier1NamePrefix: LocalityItem[] = [];
  const tier2WordBoundary: LocalityItem[] = [];
  const tier3SubPrefix: LocalityItem[] = [];
  const tier4NameSubstring: LocalityItem[] = [];
  const tier5Other: LocalityItem[] = [];

  for (const loc of BENGALURU_LOCALITIES) {
    const nameLower = loc.name.toLowerCase();
    const subList = (loc.popularSubLocalities || []).map(s => s.toLowerCase());

    if (nameLower.startsWith(clean)) {
      tier1NamePrefix.push(loc);
    } else if (new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(nameLower)) {
      tier2WordBoundary.push(loc);
    } else if (subList.some(s => s.startsWith(clean))) {
      tier3SubPrefix.push(loc);
    } else if (nameLower.includes(clean)) {
      tier4NameSubstring.push(loc);
    } else if (
      loc.zone.toLowerCase().includes(clean) ||
      subList.some(s => s.includes(clean))
    ) {
      tier5Other.push(loc);
    }
  }

  return [
    ...tier1NamePrefix,
    ...tier2WordBoundary,
    ...tier3SubPrefix,
    ...tier4NameSubstring,
    ...tier5Other
  ].slice(0, 16);
}

/**
 * Ranked Bengaluru society / apartment / developer search:
 * Tier 1: Society name starts with query (e.g. "Sobha..." or "S...")
 * Tier 2: Builder / developer starts with query (e.g. typing "S" or "Sobha" surfaces all Sobha projects!)
 * Tier 3: Word boundary in society name starts with query
 * Tier 4: Substring in society name
 * Tier 5: Substring in builder or locality
 */
export function searchSocieties(query: string, localityFilter?: string): SocietyItem[] {
  const clean = (query || '').toLowerCase().trim();
  let list = BENGALURU_SOCIETIES;

  if (localityFilter && localityFilter.trim().length > 0) {
    const locClean = localityFilter.toLowerCase().trim();
    const matched = list.filter(soc => soc.locality.toLowerCase().includes(locClean));
    if (matched.length > 0) {
      list = matched;
    }
  }

  if (!clean) {
    return list.slice(0, 16);
  }

  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tier1NamePrefix: SocietyItem[] = [];
  const tier2BuilderPrefix: SocietyItem[] = [];
  const tier3WordBoundary: SocietyItem[] = [];
  const tier4NameSubstring: SocietyItem[] = [];
  const tier5Other: SocietyItem[] = [];

  for (const soc of list) {
    const nameLower = soc.name.toLowerCase();
    const builderLower = soc.builder.toLowerCase();
    const locLower = soc.locality.toLowerCase();

    if (nameLower.startsWith(clean)) {
      tier1NamePrefix.push(soc);
    } else if (builderLower.startsWith(clean)) {
      tier2BuilderPrefix.push(soc);
    } else if (new RegExp(`\\b${escaped}`, 'i').test(nameLower)) {
      tier3WordBoundary.push(soc);
    } else if (nameLower.includes(clean)) {
      tier4NameSubstring.push(soc);
    } else if (builderLower.includes(clean) || locLower.includes(clean)) {
      tier5Other.push(soc);
    }
  }

  return [
    ...tier1NamePrefix,
    ...tier2BuilderPrefix,
    ...tier3WordBoundary,
    ...tier4NameSubstring,
    ...tier5Other
  ].slice(0, 16);
}

/**
 * Helper to convert Indian currency number to friendly string (e.g. ₹1.45 Cr or ₹85 Lakhs)
 */
export function formatIndianCurrency(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Crore`;
  }
  if (amount >= 100000) {
    const lakhs = (amount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lakhs} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
