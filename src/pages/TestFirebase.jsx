import { useEffect, useState } from 'react';
import LoadingState from '../components/ui/LoadingState.jsx';
import * as museumService from '../services/museumService.js';

function TestFirebase() {
  const [status, setStatus] = useState({ loading: true, count: null, error: '' });

  useEffect(() => {
    let isActive = true;

    async function loadExhibits() {
      try {
        const exhibits = await museumService.getExhibits();
        console.log('Firebase exhibits:', exhibits);
        if (isActive) {
          setStatus({ loading: false, count: exhibits.length, error: '' });
        }
      } catch (error) {
        console.log('Firebase exhibits error:', error);
        if (isActive) {
          setStatus({
            loading: false,
            count: null,
            error: error instanceof Error ? error.message : 'Eksponatlarni yuklab bo‘lmadi.',
          });
        }
      }
    }

    loadExhibits();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section aria-labelledby="firebase-test-heading">
      <h1 className="page-heading" id="firebase-test-heading">Firebase testi</h1>
      {status.loading ? (
        <LoadingState label="Eksponatlar yuklanmoqda..." />
      ) : status.error ? (
        <p role="alert">{status.error}</p>
      ) : (
        <p role="status">{status.count} ta eksponat yuklandi.</p>
      )}
    </section>
  );
}

export default TestFirebase;
