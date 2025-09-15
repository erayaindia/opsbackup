import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, RotateCcw, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelfieCaptureProps {
  onSelfieCapture: (imageBlob: Blob, imageDataUrl: string) => void;
  employeeId: string;
  isLoading?: boolean;
}

const SelfieCapture: React.FC<SelfieCaptureProps> = ({
  onSelfieCapture,
  employeeId,
  isLoading = false
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    setError('');

    try {
      console.log('🎥 Requesting camera access...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });

      console.log('✅ Camera access granted');
      console.log('📹 Stream:', mediaStream);
      console.log('🎬 Video tracks:', mediaStream.getVideoTracks());

      setStream(mediaStream);

      // Wait for next tick to ensure video element is ready
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          console.log('🖥️ Setting up video element...');

          videoRef.current.srcObject = mediaStream;

          // Set up video element properly
          videoRef.current.onloadedmetadata = () => {
            console.log('📊 Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('▶️ Video playing successfully');
                setIsVideoReady(true);
                setIsStartingCamera(false);
              }).catch(err => {
                console.error('❌ Error playing video:', err);
                setError('Failed to start video preview');
                setIsStartingCamera(false);
              });
            }
          };

          // Handle video ready state
          videoRef.current.oncanplay = () => {
            console.log('🎯 Video can play');
            setIsVideoReady(true);
            setIsStartingCamera(false);
          };

          // Also try immediate play
          videoRef.current.play().catch(err => {
            console.log('⚠️ Initial play failed, waiting for metadata:', err);
          });
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('Camera access denied. Please allow camera permissions and try again.');
            break;
          case 'NotFoundError':
            setError('No camera found. Please check your camera connection.');
            break;
          case 'NotReadableError':
            setError('Camera is being used by another application.');
            break;
          default:
            setError('Unable to access camera. Please try again.');
        }
      } else {
        setError('Camera initialization failed.');
      }
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and data URL
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedImage(dataUrl);

          toast({
            title: "Photo captured",
            description: "Please review your photo before proceeding.",
          });
        }
      },
      'image/jpeg',
      0.8
    );
  }, [toast]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setError('');
    setIsVideoReady(false);
    // Restart camera
    if (stream) {
      setIsVideoReady(true);
    }
  };

  const confirmPhoto = () => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onSelfieCapture(blob, capturedImage);
          stopCamera();
        }
      },
      'image/jpeg',
      0.8
    );
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Debug effect to monitor stream changes
  React.useEffect(() => {
    console.log('🔄 Stream state changed:', {
      hasStream: !!stream,
      isVideoReady,
      isStartingCamera,
      hasVideoElement: !!videoRef.current
    });
  }, [stream, isVideoReady, isStartingCamera]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Take Your Photo</CardTitle>
        <CardDescription>
          Please take a clear selfie for attendance verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          {!stream && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Camera not started</p>
              </div>
            </div>
          )}

          {stream && !capturedImage && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover mirror"
                autoPlay
                muted
                playsInline
                controls={false}
                style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie camera
              />

              {/* Video loading overlay */}
              {(!isVideoReady || isStartingCamera) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured selfie"
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Keep mirror effect for captured image
            />
          )}

          {/* Camera Controls Overlay */}
          {stream && !capturedImage && isVideoReady && !isStartingCamera && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-white hover:bg-gray-100 text-gray-800 shadow-lg"
                disabled={isLoading}
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo processing */}
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!stream && !capturedImage && (
            <Button
              onClick={startCamera}
              className="w-full"
              disabled={isStartingCamera || isLoading}
            >
              {isStartingCamera ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Camera...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </>
              )}
            </Button>
          )}

          {capturedImage && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                disabled={isLoading}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={confirmPhoto}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Photo Guidelines:</p>
          <ul className="space-y-1 ml-2">
            <li>• Look directly at the camera</li>
            <li>• Ensure good lighting on your face</li>
            <li>• Remove any obstructions (masks, hats, sunglasses)</li>
            <li>• Keep your face centered in the frame</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfieCapture;