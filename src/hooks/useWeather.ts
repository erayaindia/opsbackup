import { useState, useEffect } from 'react'

interface WeatherData {
  location: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
}

interface MultiCityWeatherData {
  cities: WeatherData[]
  currentCityIndex: number
}

export function useWeather() {
  const [multiCityWeather, setMultiCityWeather] = useState<MultiCityWeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to generate weather for a specific city
  const generateWeatherForCity = (cityName: string, lat: number, lng: number): WeatherData => {
    const hour = new Date().getHours()
    const isNight = hour < 6 || hour > 18
    
    // City-specific temperature adjustments
    let baseTemp = 22
    if (cityName.toLowerCase() === 'patna') {
      // Patna climate - typically warmer
      baseTemp = hour < 6 || hour > 20 ? 18 : 28
    } else if (cityName.toLowerCase() === 'delhi') {
      // Delhi climate - more extreme temperatures
      baseTemp = hour < 6 || hour > 20 ? 15 : 32
    }
    
    const temp = baseTemp + Math.round(Math.random() * 8 - 4) // ±4°C variation
    
    const weatherConditions = [
      { desc: 'Clear Sky', icon: isNight ? '01n' : '01d', prob: 0.4 },
      { desc: 'Few Clouds', icon: isNight ? '02n' : '02d', prob: 0.3 },
      { desc: 'Partly Cloudy', icon: isNight ? '03n' : '03d', prob: 0.2 },
      { desc: 'Light Rain', icon: isNight ? '10n' : '10d', prob: 0.1 }
    ]
    
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
    
    return {
      location: `${cityName}, IN`,
      temperature: Math.max(temp, 5), // Don't go below 5°C for Indian cities
      description: randomWeather.desc,
      icon: randomWeather.icon,
      humidity: 45 + Math.round(Math.random() * 40), // 45-85%
      windSpeed: Math.round((Math.random() * 8 + 2) * 10) / 10, // 0.2-8.0 m/s
      feelsLike: temp + Math.round(Math.random() * 6 - 3) // ±3°C
    }
  }

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)

        // Define the cities we want to show
        const cities = [
          { name: 'Patna', lat: 25.5941, lng: 85.1376 },
          { name: 'Delhi', lat: 28.7041, lng: 77.1025 }
        ]

        // Generate weather for both cities
        const citiesWeather = cities.map(city => 
          generateWeatherForCity(city.name, city.lat, city.lng)
        )

        setMultiCityWeather({
          cities: citiesWeather,
          currentCityIndex: 0 // Start with first city
        })

      } catch (err) {
        console.error('Weather fetch error:', err)
        
        // Fallback with default data for both cities
        setMultiCityWeather({
          cities: [
            {
              location: 'Patna, IN',
              temperature: 25,
              description: 'Pleasant Weather',
              icon: '01d',
              humidity: 65,
              windSpeed: 3.5,
              feelsLike: 27
            },
            {
              location: 'Delhi, IN',
              temperature: 22,
              description: 'Clear Sky',
              icon: '01d',
              humidity: 60,
              windSpeed: 2.8,
              feelsLike: 24
            }
          ],
          currentCityIndex: 0
        })
        setError(null) // Don't show error, just use fallback
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Function to switch between cities
  const switchCity = () => {
    if (multiCityWeather && multiCityWeather.cities.length > 1) {
      const nextIndex = (multiCityWeather.currentCityIndex + 1) % multiCityWeather.cities.length
      setMultiCityWeather({
        ...multiCityWeather,
        currentCityIndex: nextIndex
      })
    }
  }

  // Get current weather (for backwards compatibility)
  const currentWeather = multiCityWeather?.cities[multiCityWeather.currentCityIndex] || null

  return { 
    weather: currentWeather,
    multiCityWeather,
    switchCity,
    loading, 
    error 
  }
}