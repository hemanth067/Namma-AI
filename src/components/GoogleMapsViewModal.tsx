import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { X, MapPin, Navigation, Search, ExternalLink, Sparkles, Compass } from 'lucide-react';

interface GoogleMapsViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface PlaceMarker {
  id: string;
  name: string;
  nameTa: string;
  position: { lat: number; lng: number };
  category: 'Heritage' | 'Coastal' | 'Nature' | 'City';
  description: string;
  highlightTa: string;
}

const TAMIL_NADU_LANDMARKS: PlaceMarker[] = [
  {
    id: 'marina',
    name: 'Marina Beach, Chennai',
    nameTa: 'மெரினா கடற்கரை, சென்னை',
    position: { lat: 13.0500, lng: 80.2824 },
    category: 'Coastal',
    description: "The world's second longest natural urban beach along the Bay of Bengal in Chennai.",
    highlightTa: 'உலகின் இரண்டாவது மிக நீண்ட இயற்கை கடற்கரை.'
  },
  {
    id: 'kapaleeshwarar',
    name: 'Kapaleeshwarar Temple, Mylapore',
    nameTa: 'கபாலீஸ்வரர் கோவில், மயிலாப்பூர்',
    position: { lat: 13.0334, lng: 80.2694 },
    category: 'Heritage',
    description: 'Ancient 7th century CE Dravidian temple dedicated to Lord Shiva, heart of Carnatic music festival.',
    highlightTa: '7-ஆம் நூற்றாண்டு திராவிடக் கட்டிடக்கலை அற்புதம்.'
  },
  {
    id: 'mahabalipuram',
    name: 'Shore Temple, Mahabalipuram',
    nameTa: 'கடற்கரை கோவில், மாமல்லபுரம்',
    position: { lat: 12.6162, lng: 80.1989 },
    category: 'Heritage',
    description: 'Iconic 8th century Pallava dynasty stone-cut architectural masterpiece by the sea.',
    highlightTa: 'பல்லவர் கால யுனெஸ்கோ உலக பாரம்பரிய சின்னம்.'
  },
  {
    id: 'brihadeeswarar',
    name: 'Brihadeeswarar Temple, Thanjavur',
    nameTa: 'பெருவுடையார் கோவில் (தஞ்சை பெரிய கோவில்)',
    position: { lat: 10.7828, lng: 79.1318 },
    category: 'Heritage',
    description: 'Rajaraja Chola I built 11th-century temple masterpiece with monolithic granite vimana.',
    highlightTa: 'முதலாம் ராஜராஜ சோழனின் பிரம்மாண்ட கற்றளி.'
  },
  {
    id: 'meenakshi',
    name: 'Meenakshi Amman Temple, Madurai',
    nameTa: 'மீனாட்சி அம்மன் கோவில், மதுரை',
    position: { lat: 9.9195, lng: 78.1193 },
    category: 'Heritage',
    description: 'Renowned temple with 14 gopurams soaring over the historic Pandyan capital city of Madurai.',
    highlightTa: 'வரலாற்றுச் சிறப்புமிக்க 14 கோபுரங்கள் கொண்ட திருக்கோவில்.'
  },
  {
    id: 'ooty',
    name: 'Botanical Gardens, Ooty',
    nameTa: 'தாவரவியல் பூங்கா, ஊட்டி',
    position: { lat: 11.4172, lng: 76.7118 },
    category: 'Nature',
    description: 'Lush Nilgiri mountain flora reserve spanning 55 acres at 2,200m altitude.',
    highlightTa: 'நீலகிரி மலையின் அழகிய தாவரவியல் சரணாலயம்.'
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal Lake & Pillar Rocks',
    nameTa: 'கொடைக்கானல் ஏரி & பில்லர் ராக்ஸ்',
    position: { lat: 10.2381, lng: 77.4892 },
    category: 'Nature',
    description: 'Star-shaped lake in the mist-clad Palani Hills surrounded by pine forests.',
    highlightTa: 'மலைகளின் இளவரசி கொடைக்கானலின் மைய ஏரி.'
  },
  {
    id: 'kanyakumari',
    name: 'Vivekananda Rock Memorial, Kanyakumari',
    nameTa: 'விவேகானந்தர் பாறை நினைவு மண்டபம்',
    position: { lat: 8.0780, lng: 77.5550 },
    category: 'Coastal',
    description: 'Confluence point of Arabian Sea, Bay of Bengal, and Indian Ocean at the southern tip.',
    highlightTa: 'முக்கடல் சங்கமிக்கும் இந்தியாவின் தென்கோடி முனை.'
  },
  {
    id: 'rameswaram',
    name: 'Ramanathaswamy Temple, Rameswaram',
    nameTa: 'ராமநாதசுவாமி திருக்கோவில், ராமேஸ்வரம்',
    position: { lat: 9.2881, lng: 79.3174 },
    category: 'Heritage',
    description: 'Famed for the longest corridor among all Hindu temples in India with sculpted pillars.',
    highlightTa: 'இந்தியாவின் மிக நீண்ட பிரகார நடைபாதை கொண்ட புனித தலம்.'
  },
  {
    id: 'rockfort',
    name: 'Rockfort Temple, Tiruchirappalli',
    nameTa: 'மலைக்கோட்டை உச்சிப்பிள்ளையார் கோவில், திருச்சி',
    position: { lat: 10.8286, lng: 78.6967 },
    category: 'Heritage',
    description: 'Ancient temple perched atop an 83-meter high geological rock outcrop in the center of Trichy.',
    highlightTa: '83 மீட்டர் உயர பாறை மீது அமைந்துள்ள கம்பீர கோவில்.'
  }
];

export const GoogleMapsViewModal: React.FC<GoogleMapsViewModalProps> = ({
  isOpen,
  onClose,
  initialQuery
}) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  });
  const [selectedPlace, setSelectedPlace] = useState<PlaceMarker | null>(TAMIL_NADU_LANDMARKS[0]);
  const [center, setCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Chennai default
  const [zoom, setZoom] = useState(11);
  const [searchFilter, setSearchFilter] = useState(initialQuery || '');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Heritage' | 'Coastal' | 'Nature'>('All');

  // Fetch API key from backend if not directly in client env
  useEffect(() => {
    if (!apiKey) {
      fetch('/api/maps-key')
        .then((res) => {
          if (res.status === 429) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          return res.json();
        })
        .then((data) => {
          if (data.apiKey) setApiKey(data.apiKey);
        })
        .catch((e) => console.warn('Could not fetch maps key:', e));
    }
  }, [apiKey]);

  const filteredPlaces = TAMIL_NADU_LANDMARKS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.nameTa.includes(searchFilter) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectPlace = (place: PlaceMarker) => {
    setSelectedPlace(place);
    setCenter(place.position);
    setZoom(14);
  };

  const getPinColors = (category: string) => {
    switch (category) {
      case 'Heritage':
        return { bg: '#d97706', border: '#b45309', glyph: '#ffffff' };
      case 'Coastal':
        return { bg: '#0284c7', border: '#0369a1', glyph: '#ffffff' };
      case 'Nature':
        return { bg: '#059669', border: '#047857', glyph: '#ffffff' };
      default:
        return { bg: '#10b981', border: '#047857', glyph: '#ffffff' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-neutral-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shrink-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>Google Maps Platform</span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">· தமிழ் நாடு வரைபடம்</span>
              </h2>
              <p className="text-[11px] text-neutral-500">
                Explore Chennai & Tamil Nadu destinations with live interactive maps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close Maps Modal"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split: Places Sidebar + Interactive Map */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Places Explorer Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-neutral-950/60 overflow-hidden shrink-0">
            {/* Search Input */}
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter places / இடங்களைத் தேடு..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {(['All', 'Heritage', 'Coastal', 'Nature'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat === 'All' ? 'அனைத்தும் (All)' : cat === 'Heritage' ? 'கோவில்கள் (Heritage)' : cat === 'Coastal' ? 'கடற்கரை (Coastal)' : 'இயற்கை (Nature)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Places List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredPlaces.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  இடங்கள் கிடைக்கவில்லை / No places matched
                </div>
              ) : (
                filteredPlaces.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  const colors = getPinColors(place.category);
                  return (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colors.bg }}
                          />
                          <span className="text-xs font-semibold">{place.name}</span>
                        </div>
                        <Navigation className={`w-3 h-3 ${isSelected ? 'text-emerald-600' : 'text-neutral-400'}`} />
                      </div>
                      <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {place.nameTa}
                      </p>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {place.description}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Quick Info */}
            <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 text-[10px] text-neutral-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-500" />
                <span>{filteredPlaces.length} destinations ready</span>
              </span>
              <span className="text-[9px] text-neutral-400">Tamil Nadu, India</span>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div className="flex-1 h-full min-h-[300px] relative bg-neutral-100 dark:bg-neutral-900">
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  center={center}
                  zoom={zoom}
                  onCameraChanged={(ev) => {
                    setCenter(ev.detail.center);
                    setZoom(ev.detail.zoom);
                  }}
                  mapId="DEMO_MAP_ID"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  {TAMIL_NADU_LANDMARKS.map((place) => {
                    const colors = getPinColors(place.category);
                    return (
                      <AdvancedMarker
                        key={place.id}
                        position={place.position}
                        onClick={() => setSelectedPlace(place)}
                        title={place.name}
                      >
                        <Pin
                          background={colors.bg}
                          borderColor={colors.border}
                          glyphColor={colors.glyph}
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {selectedPlace && (
                    <InfoWindow
                      position={selectedPlace.position}
                      onCloseClick={() => setSelectedPlace(null)}
                    >
                      <div className="p-1.5 max-w-xs text-neutral-900">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-3 h-3" />
                          <span>{selectedPlace.category} Destination</span>
                        </div>
                        <h3 className="font-bold text-xs text-neutral-900">{selectedPlace.name}</h3>
                        <p className="text-[11px] text-emerald-700 font-medium">{selectedPlace.nameTa}</p>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{selectedPlace.description}</p>
                        <p className="text-[10px] text-neutral-500 italic mt-0.5">{selectedPlace.highlightTa}</p>
                        
                        <div className="mt-2.5 pt-2 border-t border-neutral-200 flex items-center justify-between">
                          <span className="text-[9px] text-neutral-400">
                            {selectedPlace.position.lat.toFixed(4)}°N, {selectedPlace.position.lng.toFixed(4)}°E
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.position.lat},${selectedPlace.position.lng}&utm_campaign=gmp_mcp_codeassist_v1_aistudio`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>View on Google Maps</span>
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-neutral-500">
                <MapPin className="w-10 h-10 text-emerald-500 animate-bounce mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Google Maps Platform Loading
                </h3>
                <p className="text-xs max-w-sm mt-1">
                  Connecting to provisioned Google Maps API key...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
