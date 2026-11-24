import { ArrowLeft, House, WarningCircle } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="not-found-page" aria-labelledby="not-found-heading">
      <span className="not-found-page__icon" aria-hidden="true">
        <WarningCircle size={34} weight="light" />
      </span>
      <p className="not-found-page__code">404</p>
      <h1 className="page-heading" id="not-found-heading">Sahifa topilmadi</h1>
      <p className="not-found-page__message">
        Bu manzil mavjud emas yoki sahifa boshqa joyga ko‘chirilgan.
      </p>
      <Link className="not-found-page__home" to="/">
        <House size={18} weight="regular" aria-hidden="true" />
        Bosh sahifaga qaytish
      </Link>
      <button className="not-found-page__back" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} weight="regular" aria-hidden="true" />
        Oldingi sahifaga qaytish
      </button>
    </section>
  );
}

export default NotFoundPage;
