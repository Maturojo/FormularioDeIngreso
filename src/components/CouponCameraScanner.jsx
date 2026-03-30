import { useEffect, useId, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function CouponCameraScanner({ active, onDetected, onError }) {
  const scannerRef = useRef(null);
  const handledValueRef = useRef('');
  const elementId = `coupon-camera-scanner-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (!active) {
      handledValueRef.current = '';

      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }

      return undefined;
    }

    const scanner = new Html5QrcodeScanner(
      elementId,
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        supportedFormats: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8
        ]
      },
      false
    );

    scannerRef.current = scanner;
    scanner.render(
      (decodedText) => {
        if (!decodedText || handledValueRef.current === decodedText) {
          return;
        }

        handledValueRef.current = decodedText;
        onDetected(decodedText);
      },
      () => {}
    );

    return () => {
      handledValueRef.current = '';

      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((error) => {
            onError?.(error);
          })
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [active, elementId, onDetected, onError]);

  if (!active) {
    return null;
  }

  return <div id={elementId} className="camera-scanner" />;
}
