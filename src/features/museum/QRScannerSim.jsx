import { useEffect, useState } from 'react';
import { Camera, QrCode } from '@phosphor-icons/react';
import Modal from '../../components/ui/Modal.jsx';
import './QRScannerSim.css';

function QRScannerSim() {
  const [isScanning, setIsScanning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isScanning) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsScanning(false);
      setIsComplete(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isScanning]);

  function startScan() {
    setIsComplete(false);
    setIsScanning(true);
  }

  function closeScan() {
    setIsScanning(false);
  }

  return (
    <>
      <button className="qr-scan-button" type="button" onClick={startScan}>
        <QrCode size={16} weight="regular" aria-hidden="true" />
        QR kodni skanerlash
      </button>

      <Modal isOpen={isScanning} onClose={closeScan} title="QR kod skaneri">
        <div className="qr-scanner" role="status" aria-label="QR kod skanerlanmoqda">
          <div className="qr-scanner__view">
            <Camera className="qr-scanner__camera" size={30} weight="regular" aria-hidden="true" />
            <div className="qr-scanner__corners" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="qr-scanner__line" aria-hidden="true" />
          </div>
          <p className="qr-scanner__status">QR kod qidirilmoqda...</p>
        </div>
      </Modal>

      <Modal
        isOpen={isComplete}
        onClose={() => setIsComplete(false)}
        title="QR kod skanerlandi!"
      >
        <div className="qr-scan-result" role="status">
          <span className="qr-scan-result__icon">
            <QrCode size={25} weight="regular" aria-hidden="true" />
          </span>
          <p>
            Skanerlandi! Qo‘shimcha ma’lumot: Ushbu eksponat 3D formatda mavjud
          </p>
        </div>
      </Modal>
    </>
  );
}

export default QRScannerSim;
