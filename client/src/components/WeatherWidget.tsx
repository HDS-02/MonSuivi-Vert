import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Interface pour les données météo
interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  recommendations: string[];
  location: string;
  forecast?: {
    temperature: number;
    humidity: number;
    description: string;
    icon: string;
  };
}

// Traduction des codes météo en icônes Material Icons
function getWeatherIconFromCode(code: number): string {
  console.log('Code météo reçu:', code);
  
  // Codes de WeatherAPI.com
  switch (code) {
    // Ensoleillé
    case 1000: return 'wb_sunny';
    
    // Partiellement nuageux
    case 1003: return 'partly_cloudy_day';
    case 1006: return 'cloud';
    case 1009: return 'cloud';
    
    // Nuageux
    case 1030: return 'cloud';
    case 1135: return 'cloud';
    case 1147: return 'cloud';
    
    // Pluie
    case 1063: return 'water_drop';
    case 1069: return 'water_drop';
    case 1072: return 'water_drop';
    case 1087: return 'thunderstorm';
    case 1150: return 'water_drop';
    case 1153: return 'water_drop';
    case 1168: return 'water_drop';
    case 1171: return 'water_drop';
    case 1180: return 'water_drop';
    case 1183: return 'water_drop';
    case 1186: return 'water_drop';
    case 1189: return 'water_drop';
    case 1192: return 'water_drop';
    case 1195: return 'water_drop';
    case 1198: return 'water_drop';
    case 1201: return 'water_drop';
    case 1204: return 'water_drop';
    case 1207: return 'water_drop';
    
    // Neige
    case 1066: return 'ac_unit';
    case 1114: return 'ac_unit';
    case 1117: return 'ac_unit';
    case 1210: return 'ac_unit';
    case 1213: return 'ac_unit';
    case 1216: return 'ac_unit';
    case 1219: return 'ac_unit';
    case 1222: return 'ac_unit';
    case 1225: return 'ac_unit';
    
    // Orage
    case 1237: return 'thunderstorm';
    case 1240: return 'thunderstorm';
    case 1243: return 'thunderstorm';
    case 1246: return 'thunderstorm';
    case 1249: return 'thunderstorm';
    case 1252: return 'thunderstorm';
    case 1255: return 'thunderstorm';
    case 1258: return 'thunderstorm';
    case 1261: return 'thunderstorm';
    case 1264: return 'thunderstorm';
    
    default:
      console.log('Code non reconnu:', code);
      return 'wb_cloudy';
  }
}

// Conseils d'entretien basés sur les conditions météorologiques
function generateRecommendations(temperature: number, humidity: number): string[] {
  const recommendations: string[] = [];
  
  // Recommandations basées sur la température
  if (temperature > 28) {
    recommendations.push("Arrosez vos plantes plus fréquemment à cause de la chaleur.");
    recommendations.push("Placez vos plantes d'intérieur à l'abri du soleil direct.");
  } else if (temperature > 22) {
    recommendations.push("Température idéale pour la plupart des plantes. Surveillez l'humidité.");
  } else if (temperature > 15) {
    recommendations.push("Conditions de croissance favorables. Arrosage modéré recommandé.");
  } else if (temperature > 10) {
    recommendations.push("Réduisez l'arrosage, les plantes ont besoin de moins d'eau.");
  } else {
    recommendations.push("Protégez vos plantes sensibles du froid.");
    recommendations.push("Évitez d'arroser en fin de journée pour prévenir le gel des racines.");
  }
  
  // Recommandations basées sur l'humidité
  if (humidity > 70) {
    recommendations.push("Humidité élevée: attention aux maladies fongiques.");
    recommendations.push("Assurez une bonne circulation d'air autour de vos plantes.");
  } else if (humidity < 40) {
    recommendations.push("Air sec: brumisez vos plantes d'intérieur régulièrement.");
  }
  
  return recommendations;
}

// Associer les codes météo aux icônes Material Icons
function getWeatherIcon(iconCode: string): string {
  switch (iconCode) {
    case 'clear_day': return 'wb_sunny';
    case 'partly_cloudy': return 'partly_cloudy_day';
    case 'cloudy': return 'cloud';
    case 'rainy': return 'water_drop';
    default: return 'wb_cloudy';
  }
}

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État pour la géolocalisation
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupération de la position géographique de l'utilisateur
        const getLocation = () => {
          return new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("La géolocalisation n'est pas prise en charge par votre navigateur"));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0
            });
          });
        };
        
        try {
          const position = await getLocation();
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=d5be8837b69d404486321729253004&q=${latitude},${longitude}&days=2&lang=fr`);
          
          if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données météo');
          }
          
          const data = await response.json();
          console.log('Données météo reçues:', data.current.condition);
          
          // Formatage des données pour notre interface
          const weatherData: WeatherData = {
            temperature: Math.round(data.current.temp_c),
            humidity: data.current.humidity,
            description: data.current.condition.text,
            icon: getWeatherIconFromCode(data.current.condition.code),
            location: data.location.name + ', ' + data.location.country,
            recommendations: generateRecommendations(data.current.temp_c, data.current.humidity),
            forecast: {
              temperature: Math.round(data.forecast.forecastday[1].day.avgtemp_c),
              humidity: data.forecast.forecastday[1].day.avghumidity,
              description: data.forecast.forecastday[1].day.condition.text,
              icon: getWeatherIconFromCode(data.forecast.forecastday[1].day.condition.code)
            }
          };
          
          setWeatherData(weatherData);
        } catch (locError) {
          console.error("Erreur de géolocalisation:", locError);
          const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=d5be8837b69d404486321729253004&q=Paris&days=2&lang=fr`);
          const data = await response.json();
          console.log('Données météo Paris:', data.current.condition);
          
          const weatherData: WeatherData = {
            temperature: Math.round(data.current.temp_c),
            humidity: data.current.humidity,
            description: data.current.condition.text,
            icon: getWeatherIconFromCode(data.current.condition.code),
            location: "Paris, France",
            recommendations: generateRecommendations(data.current.temp_c, data.current.humidity),
            forecast: {
              temperature: Math.round(data.forecast.forecastday[1].day.avgtemp_c),
              humidity: data.forecast.forecastday[1].day.avghumidity,
              description: data.forecast.forecastday[1].day.condition.text,
              icon: getWeatherIconFromCode(data.forecast.forecastday[1].day.condition.code)
            }
          };
          
          setWeatherData(weatherData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données météo:", err);
        setError("Impossible de récupérer les données météo");
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-gray-100 rounded-xl shadow-md">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <div className="bg-red-50 rounded-full inline-block p-3">
              <span className="material-icons text-3xl text-red-500">error_outline</span>
            </div>
            <p className="mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-100 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <h3 className="text-lg font-semibold flex items-center relative">
          <span className="material-icons mr-2">wb_sunny</span>
          Météo et conseils d'entretien
        </h3>
      </div>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 animate-pulse flex items-center justify-center">
                <span className="material-icons text-blue-300 text-2xl">wb_cloudy</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-center">
                <Skeleton className="h-5 w-[80px] bg-blue-50" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-4 w-[120px] bg-blue-50" />
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Skeleton className="h-4 w-full bg-gray-50" />
              <Skeleton className="h-4 w-5/6 bg-gray-50" />
              <Skeleton className="h-4 w-4/5 bg-gray-50" />
            </div>
          </div>
        ) : weatherData ? (
          <div>
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-4 rounded-full shadow-inner hover:shadow-lg transition-all duration-300">
                <span className="material-icons text-5xl text-blue-600">
                  {getWeatherIcon(weatherData.icon)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Température</div>
                <div className="text-2xl font-medium text-blue-600">{weatherData.temperature}°C</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Humidité</div>
                <div className="text-2xl font-medium text-blue-600">{weatherData.humidity}%</div>
              </div>
            </div>
            
            <div className="text-center text-gray-700 mb-1 font-medium">{weatherData.description}</div>
            
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-50 px-3 py-1 rounded-full flex items-center hover:bg-blue-100 transition-colors duration-200">
                <span className="material-icons text-blue-600 text-sm mr-1">location_on</span>
                <span className="text-sm text-blue-700 font-medium">{weatherData.location}</span>
              </div>
            </div>
            
            {/* Prévisions pour demain */}
            {weatherData.forecast && (
              <div className="mt-4 mb-4 border-t border-b border-blue-100 py-4">
                <h4 className="font-medium mb-3 text-blue-700 flex items-center justify-center">
                  <span className="material-icons mr-2 text-sm">calendar_today</span>
                  Prévisions pour demain
                </h4>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="bg-blue-50 rounded-full p-2 mb-1 inline-block hover:bg-blue-100 transition-colors duration-200">
                      <span className="material-icons text-blue-600">
                        {getWeatherIcon(weatherData.forecast.icon)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{weatherData.forecast.description}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Température</div>
                    <div className="text-lg font-medium text-blue-600">{weatherData.forecast.temperature}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-1">Humidité</div>
                    <div className="text-lg font-medium text-blue-600">{weatherData.forecast.humidity}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recommandations */}
            {weatherData.recommendations && weatherData.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-blue-700 flex items-center">
                  <span className="material-icons mr-2 text-sm">tips_and_updates</span>
                  Conseils d'entretien
                </h4>
                <ul className="space-y-2">
                  {weatherData.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                      <span className="material-icons text-green-600 text-sm mr-2 mt-0.5">eco</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}