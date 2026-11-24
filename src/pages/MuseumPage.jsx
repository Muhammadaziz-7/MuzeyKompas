import { useMemo } from 'react';
import { combineMuseumExhibits } from '../services/museumService.js';
import { useData } from '../context/DataContext.jsx';
import VirtualTour from '../components/museum/VirtualTour.jsx';
import './MuseumPage.css';

function MuseumPage() {
  const { exhibits: museumExhibits, curatorExhibits } = useData();

  const exhibits = useMemo(
    () => combineMuseumExhibits(museumExhibits, curatorExhibits),
    [curatorExhibits, museumExhibits],
  );

  // Eksponatlarni koordinatalar va ma'lumotlar bilan boyitish
  const exhibitsWithPositions = useMemo(() => {
    // Har bir eksponatning ID ga qarab aniq koordinata va ma'lumotlarni belgilash
    const exhibitConfig = {
      'brass-ewer': {
        title: 'Qadimiy mis ko\'za (Choydish)',
        period: 'XIX asr',
        description: 'Kandakorlik san\'ati asosida naqshinkor qilib ishlangan an\'anaviy mis idish.',
        positions: {
          main: { x: 13, y: 68 },
          left: { x: 20, y: 66 },
        }
      },
      'jewelry-case': {
        title: 'Kumush taqinchoqlar to\'plami',
        period: 'XIX–XX asr boshlari',
        description: 'Ayollarning an\'anaviy bo\'yin va ko\'krak bezaklari, nafis zargarlik namunasi.',
        positions: {
          main: { x: 27, y: 64 },
          left: { x: 43, y: 63 },
        }
      },
      'stone-slab': {
        title: 'Tosh bitik (Stela)',
        period: 'O\'rta asrlar',
        description: 'Arab alifbosidagi xattotlik yozuvlari va geometrik naqshlar o\'yilgan tarixiy yodgorlik toshi.',
        positions: {
          main: { x: 39, y: 70 },
          left: { x: 62, y: 67 },
        }
      },
      'turquoise-vases': {
        title: 'Moviy sopol vazalar',
        period: 'Temuriylar davri',
        description: 'Temuriylar davri uslubida ishlangan, feruza sir bilan qoplangan juft kulolchilik ko\'zalari.',
        positions: {
          main: { x: 51, y: 67 },
          left: { x: 79, y: 63 },
          right: { x: 13.5, y: 63 },
        }
      },
      'small-suzani': {
        title: 'Kichik kashta (So\'zana)',
        period: 'XIX asr',
        description: 'Buxoro/Samarqand maktabi. Tabiiy ipak iplar bilan tikilgan an\'anaviy devoriy bezak.',
        positions: {
          main: { x: 69, y: 62 },
          right: { x: 43.5, y: 57 },
        }
      },
      'large-suzani': {
        title: 'Katta gulli so\'zana',
        period: 'XIX asr',
        description: 'Markaziy quyosh (rozetka) va gulli motivlar bilan boyitilgan bayramona o\'zbek kashtachilik asari.',
        positions: {
          main: { x: 74.5, y: 61 },
          right: { x: 52.5, y: 57 },
        }
      },
      'carved-door': {
        title: 'O\'ymakor yog\'och eshik',
        period: 'XVIII–XIX asrlar',
        description: 'Yong\'oq yog\'ochidan islimiy va handasaviy naqshlar bilan chuqur o\'yib ishlangan me\'moriy san\'at asari.',
        positions: {
          main: { x: 82.5, y: 63 },
          right: { x: 66, y: 59 },
        }
      },
      'ceramic-lagan': {
        title: 'Rishton sopol lagani va kosalar',
        period: 'XIX–XX asrlar',
        description: 'Yashil va sariq rang uyg\'unligida tabiiy bo\'yoqlar bilan bezatilgan an\'anaviy kulolchilik namunalari.',
        positions: {
          main: { x: 93, y: 68 },
          right: { x: 85.5, y: 65 },
        }
      },
    };

    return exhibits.map((exhibit) => {
      const config = exhibitConfig[exhibit.id];

      if (!config) {
        // Agar konfiguratsiya topilmasa, default qiymatlar
        return {
          ...exhibit,
          viewPosition: 'main',
          coordinates: { x: 50, y: 50 },
        };
      }

      // Har bir view uchun alohida eksponat yaratish
      const exhibitCopies = [];

      Object.keys(config.positions).forEach((view) => {
        exhibitCopies.push({
          ...exhibit,
          id: `${exhibit.id}-${view}`,
          originalId: exhibit.id,
          title: config.title,
          period: config.period,
          description: config.description,
          viewPosition: view,
          coordinates: config.positions[view],
        });
      });

      return exhibitCopies;
    }).flat();
  }, [exhibits]);

  return (
    <section className="museum-page" aria-labelledby="museum-heading">
      <header className="museum-page__header">
        <div>
          <p className="museum-page__eyebrow">360° Virtual Tur</p>
          <h1 className="page-heading" id="museum-heading">Muzey eksponatlari</h1>
          <p className="museum-page__intro">
            Muzey zalida virtual sayohat qiling va eksponatlarni interaktiv o'rganing.
          </p>
        </div>
      </header>

      {exhibits.length === 0 ? (
        <p className="museum-page__status">Hozircha eksponatlar mavjud emas.</p>
      ) : (
        <VirtualTour exhibits={exhibitsWithPositions} />
      )}
    </section>
  );
}

export default MuseumPage;
