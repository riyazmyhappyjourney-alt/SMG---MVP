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
  { id: 'hennur-road', name: 'Hennur Road', zone: 'North', popularSubLocalities: ['Hennur Cross', 'Geddalahalli', 'Bio-tech Corridor'] },
  { id: 'devanahalli', name: 'Devanahalli', zone: 'North', popularSubLocalities: ['Aerospace Park', 'KIADB Corridor', 'Airport Road'] },
  { id: 'kalyan-nagar', name: 'Kalyan Nagar', zone: 'North', popularSubLocalities: ['HRBR Layout', 'CMR Road', 'Banaswadi'] }
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
  
  { id: 'soc-10', name: 'Sobha Dream Acres', locality: 'Panathur', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-11', name: 'Sobha City', locality: 'Thanisandra Main Road', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-12', name: 'Sobha Silicon Oasis', locality: 'Electronic City Phase 1', zone: 'South', builder: 'Sobha Limited' },
  { id: 'soc-13', name: 'Sobha Royal Pavilion', locality: 'Sarjapur Road', zone: 'East', builder: 'Sobha Limited' },
  { id: 'soc-14', name: 'Sobha HRC Pristine', locality: 'Jakkur / Hebbal', zone: 'North', builder: 'Sobha Limited' },
  { id: 'soc-15', name: 'Sobha Palladian', locality: 'Old Airport Road', zone: 'East', builder: 'Sobha Limited' },
  
  { id: 'soc-16', name: 'Salarpuria Sattva Greenage', locality: 'Hosur Road / Bommanahalli', zone: 'South', builder: 'Sattva Group' },
  { id: 'soc-17', name: 'Salarpuria Sattva Magnificia', locality: 'Old Madras Road', zone: 'East', builder: 'Sattva Group' },
  { id: 'soc-18', name: 'Salarpuria Sattva Cadenza', locality: 'Kudlu Gate', zone: 'South', builder: 'Sattva Group' },
  { id: 'soc-19', name: 'Salarpuria Sattva Anugraha', locality: 'Vijayanagar', zone: 'West', builder: 'Sattva Group' },
  { id: 'soc-20', name: 'Salarpuria Sattva Senorita', locality: 'Sarjapur Road', zone: 'East', builder: 'Sattva Group' },
  
  { id: 'soc-21', name: 'Brigade Gateway', locality: 'Rajajinagar', zone: 'West', builder: 'Brigade Group' },
  { id: 'soc-22', name: 'Brigade Metropolis', locality: 'Mahadevapura', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-23', name: 'Brigade Meadows', locality: 'Kanakapura Road', zone: 'South', builder: 'Brigade Group' },
  { id: 'soc-24', name: 'Brigade Cornerstone Utopia', locality: 'Varthur', zone: 'East', builder: 'Brigade Group' },
  { id: 'soc-25', name: 'Brigade Caladium', locality: 'Hebbal', zone: 'North', builder: 'Brigade Group' },
  { id: 'soc-26', name: 'Brigade Exotica', locality: 'Old Madras Road', zone: 'East', builder: 'Brigade Group' },
  
  { id: 'soc-27', name: 'Godrej Woodsman Estate', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-27b', name: 'Godrej Woodsman', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-28', name: 'Godrej Platinum', locality: 'Hebbal', zone: 'North', builder: 'Godrej Properties' },
  { id: 'soc-29', name: 'Godrej Air', locality: 'Whitefield', zone: 'East', builder: 'Godrej Properties' },
  { id: 'soc-30', name: 'Godrej Eternity', locality: 'Kanakapura Road', zone: 'South', builder: 'Godrej Properties' },
  { id: 'soc-31', name: 'Godrej Reflections', locality: 'Sarjapur Road', zone: 'East', builder: 'Godrej Properties' },
  
  { id: 'soc-32', name: 'Puravankara Palm Beach', locality: 'Hennur Road', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-33', name: 'Purva Westend', locality: 'Kudlu Gate', zone: 'South', builder: 'Puravankara' },
  { id: 'soc-34', name: 'Purva Venezia', locality: 'Yelahanka', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-35', name: 'Purva Atmosphere', locality: 'Thanisandra Main Road', zone: 'North', builder: 'Puravankara' },
  { id: 'soc-36', name: 'Purva Skydale', locality: 'Sarjapur Road', zone: 'East', builder: 'Puravankara' },
  
  { id: 'soc-37', name: 'Rohan Viti', locality: 'Bellandur', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-38', name: 'Rohan Iksha', locality: 'Bhoganhalli', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-39', name: 'Rohan Jharoka', locality: 'Yemalur / HAL', zone: 'East', builder: 'Rohan Builders' },
  { id: 'soc-40', name: 'Assetz Marq', locality: 'Whitefield', zone: 'East', builder: 'Assetz Property' },
  { id: 'soc-41', name: 'Assetz 63 Degree East', locality: 'Sarjapur Road', zone: 'East', builder: 'Assetz Property' },
  { id: 'soc-42', name: 'SNN Clermont', locality: 'Hebbal', zone: 'North', builder: 'SNN Estates' },
  { id: 'soc-43', name: 'SNN Raj Serenity', locality: 'Begur Road', zone: 'South', builder: 'SNN Estates' },
  { id: 'soc-44', name: 'Total Environment Windmills of Your Mind', locality: 'Whitefield', zone: 'East', builder: 'Total Environment' },
  { id: 'soc-45', name: 'Total Environment The Magic Faraway Tree', locality: 'Kanakapura Road', zone: 'South', builder: 'Total Environment' },
  { id: 'soc-46', name: 'Mantri Espana', locality: 'Bellandur', zone: 'East', builder: 'Mantri Developers' },
  { id: 'soc-47', name: 'Mantri Alpyne', locality: 'Banashankari', zone: 'South', builder: 'Mantri Developers' },
  { id: 'soc-48', name: 'SJR Watermark', locality: 'Bellandur', zone: 'East', builder: 'SJR Primecorp' },
  { id: 'soc-49', name: 'DSR Waterscape', locality: 'Horamavu', zone: 'North', builder: 'DSR Infrastructure' },
  { id: 'soc-50', name: 'Goyal Orchid Whitefield', locality: 'Whitefield', zone: 'East', builder: 'Goyal & Co' }
];

/**
 * Filter localities matching query
 */
export function searchLocalities(query: string): LocalityItem[] {
  if (!query || query.trim().length === 0) {
    return BENGALURU_LOCALITIES.slice(0, 8);
  }
  const clean = query.toLowerCase().trim();
  return BENGALURU_LOCALITIES.filter(
    loc => loc.name.toLowerCase().includes(clean) || loc.zone.toLowerCase().includes(clean)
  ).slice(0, 8);
}

/**
 * Filter societies matching query and optional locality
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
    return list.slice(0, 8);
  }

  return list.filter(
    soc => soc.name.toLowerCase().includes(clean) || soc.builder.toLowerCase().includes(clean) || soc.locality.toLowerCase().includes(clean)
  ).slice(0, 8);
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
