import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  ip: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface LocationVerifierProps {
  onLocationVerified: (locationData: LocationData) => void;
  isLoading?: boolean;
}


const LocationVerifier: React.FC<LocationVerifierProps> = ({
  onLocationVerified,
  isLoading = false
}) => {
  const [locationStatus, setLocationStatus] = useState<'pending' | 'checking' | 'verified' | 'failed'>('pending');
  const [ipStatus, setIpStatus] = useState<'pending' | 'checking' | 'verified' | 'failed'>('pending');
  const [error, setError] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Mark settings as loaded since we don't need to enforce restrictions
  useEffect(() => {
    setIsLoadingSettings(false);
  }, []);


  const getClientIP = async (): Promise<string> => {
    try {
      // In a real app, you'd get this from your backend
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP:', error);
      // Fallback for development/localhost
      return '127.0.0.1';
    }
  };

  const captureIPLocation = async () => {
    setIpStatus('checking');
    try {
      const ip = await getClientIP();
      console.log('🌐 Captured IP:', ip);

      // Always succeed - just capture the IP for admin review
      setIpStatus('verified');
      console.log('✅ IP captured successfully');
      return ip;
    } catch (error) {
      console.error('IP capture failed:', error);
      setIpStatus('failed');
      setError('Unable to capture IP address');
      return null;
    }
  };

  const captureGPSLocation = async (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    setLocationStatus('checking');

    if (!navigator.geolocation) {
      setLocationStatus('failed');
      setError('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('📍 Captured location:', { latitude, longitude, accuracy });

          // Always succeed - just capture the GPS coordinates for admin review
          setLocationStatus('verified');
          console.log('✅ GPS location captured successfully');
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationStatus('failed');

          switch (error.code) {
            case error.PERMISSION_DENIED:
              setError('Location access denied. Please enable location permissions.');
              break;
            case error.POSITION_UNAVAILABLE:
              setError('Location information unavailable.');
              break;
            case error.TIMEOUT:
              setError('Location request timed out.');
              break;
            default:
              setError('Unknown location error.');
              break;
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleCaptureLocation = async () => {
    setError('');

    // Capture both IP and GPS concurrently without restrictions
    const [ip, gpsLocation] = await Promise.all([
      captureIPLocation(),
      captureGPSLocation()
    ]);

    if (ip && gpsLocation) {
      const fullLocationData: LocationData = {
        ip,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: gpsLocation.accuracy
      };

      setLocationData(fullLocationData);
      onLocationVerified(fullLocationData);
    } else {
      // If GPS fails but IP succeeds, still allow with just IP
      if (ip) {
        const ipOnlyLocationData: LocationData = {
          ip
        };
        setLocationData(ipOnlyLocationData);
        onLocationVerified(ipOnlyLocationData);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'checking':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const allVerified = ipStatus === 'verified' && locationStatus === 'verified';
  const isChecking = ipStatus === 'checking' || locationStatus === 'checking' || isLoadingSettings;

  if (isLoadingSettings) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">Loading Settings</CardTitle>
          <CardDescription>
            Loading office location settings...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Location Capture</CardTitle>
        <CardDescription>
          We'll capture your location data for attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Network Location</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ipStatus)}
              <Badge variant="secondary" className={getStatusColor(ipStatus)}>
                {ipStatus === 'pending' ? 'Pending' :
                 ipStatus === 'checking' ? 'Capturing' :
                 ipStatus === 'verified' ? 'Captured' : 'Failed'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">GPS Location</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(locationStatus)}
              <Badge variant="secondary" className={getStatusColor(locationStatus)}>
                {locationStatus === 'pending' ? 'Pending' :
                 locationStatus === 'checking' ? 'Capturing' :
                 locationStatus === 'verified' ? 'Captured' : 'Failed'}
              </Badge>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        {!allVerified && (
          <Button
            onClick={handleCaptureLocation}
            className="w-full"
            disabled={isChecking || isLoading}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturing Location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Capture Location
              </>
            )}
          </Button>
        )}

        {allVerified && (
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="text-sm font-medium text-green-800">
              Location captured successfully!
            </p>
            <p className="text-xs text-green-600 mt-1">
              You can now proceed with check-in
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Location data is captured for admin review</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationVerifier;