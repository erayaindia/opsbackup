import React, { useState } from 'react'
import { useWeather } from '@/hooks/useWeather'
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Zap, 
  Eye,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Loader2
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const getWeatherIcon = (iconCode: string, size = 20) => {
  const iconProps = { size, className: "text-sky-500" }
  
  if (iconCode.startsWith('01')) return <Sun {...iconProps} className="text-yellow-500" />
  if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) 
    return <Cloud {...iconProps} className="text-gray-500" />
  if (iconCode.startsWith('09') || iconCode.startsWith('10')) 
    return <CloudRain {...iconProps} className="text-blue-500" />
  if (iconCode.startsWith('11')) return <Zap {...iconProps} className="text-yellow-600" />
  if (iconCode.startsWith('13')) return <CloudSnow {...iconProps} className="text-blue-200" />
  if (iconCode.startsWith('50')) return <Eye {...iconProps} className="text-gray-400" />
  
  return <Cloud {...iconProps} />
}

export function WeatherWidget() {
  const { weather, multiCityWeather, switchCity, loading, error } = useWeather()
  const [isOpen, setIsOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">Loading weather...</span>
      </div>
    )
  }

  if (error || !weather) {
    return null // Don't show anything if there's an error
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-border/50 rounded-lg"
          onClick={switchCity}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 group-hover:from-sky-100 group-hover:to-blue-100 dark:group-hover:from-sky-900 dark:group-hover:to-blue-900 transition-colors">
              {getWeatherIcon(weather.icon, 16)}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm">{weather.temperature}°</span>
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-16">
                {weather.location.split(',')[0]}
              </span>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0 border-0 shadow-2xl" align="end" sideOffset={5}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-border/50">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-200/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-xl"></div>
          </div>
          
          <div className="relative z-10 p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Weather Updates</span>
              </div>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            </div>

            {/* Both Cities Grid */}
            {multiCityWeather && (
              <div className="grid grid-cols-2 gap-3">
                {multiCityWeather.cities.map((cityWeather, index) => (
                  <div 
                    key={cityWeather.location}
                    className={`p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all duration-200 ${
                      index === multiCityWeather.currentCityIndex
                        ? 'bg-gradient-to-br from-sky-100/80 to-blue-100/80 dark:from-sky-900/80 dark:to-blue-900/80 border-sky-200 dark:border-sky-700 shadow-lg'
                        : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20 hover:bg-white/60 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => {
                      if (multiCityWeather.currentCityIndex !== index) {
                        switchCity()
                      }
                    }}
                  >
                    {/* City Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {cityWeather.location.split(',')[0]}
                      </div>
                      <div className="p-1 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950">
                        {getWeatherIcon(cityWeather.icon, 16)}
                      </div>
                    </div>
                    
                    {/* Temperature */}
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {cityWeather.temperature}°C
                    </div>
                    
                    {/* Description */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 capitalize">
                      {cityWeather.description}
                    </div>
                    
                    {/* Mini Stats */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Feels like</span>
                        <span className="font-medium">{cityWeather.feelsLike}°C</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Humidity</span>
                        <span className="font-medium">{cityWeather.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Wind</span>
                        <span className="font-medium">{cityWeather.windSpeed} m/s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-3 border-t border-white/20 dark:border-slate-700/20">
              <div className="flex items-center justify-between">
                <span>Last updated: {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
                <span className="text-xs text-slate-400">Click to switch</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}