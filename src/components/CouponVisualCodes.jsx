import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export default function CouponVisualCodes({ code, label = 'Cupón escaneable' }) {
  const barcodeRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!code) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(code, {
      margin: 1,
      width: 220,
      color: {
        dark: '#2c1c12',
        light: '#fffaf4'
      }
    })
      .then(setQrDataUrl)
      .catch(() => {
        setQrDataUrl('');
      });
  }, [code]);

  useEffect(() => {
    if (!barcodeRef.current || !code) {
      return;
    }

    JsBarcode(barcodeRef.current, code, {
      format: 'CODE128',
      lineColor: '#2c1c12',
      background: '#fffaf4',
      displayValue: false,
      margin: 0,
      width: 1.8,
      height: 54
    });
  }, [code]);

  if (!code) {
    return null;
  }

  return (
    <div className="visual-codes">
      <div className="visual-code-panel">
        <span>{label}</span>
        {qrDataUrl ? <img src={qrDataUrl} alt={`QR del cupón ${code}`} className="qr-image" /> : null}
      </div>

      <div className="visual-code-panel barcode-panel">
        <span>Código de barras</span>
        <svg ref={barcodeRef} className="barcode-svg" role="img" aria-label={`Código de barras del cupón ${code}`} />
        <small>{code}</small>
      </div>
    </div>
  );
}
