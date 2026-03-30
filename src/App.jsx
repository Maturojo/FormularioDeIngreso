import { Suspense, lazy, useEffect, useState } from 'react';
import { createLead, fetchDashboard, lookupCoupon, redeemCoupon } from './api';
import CouponVisualCodes from './components/CouponVisualCodes';

const CouponCameraScanner = lazy(() => import('./components/CouponCameraScanner'));

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  notes: ''
};

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [createdCoupon, setCreatedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [scannerStatus, setScannerStatus] = useState({ type: '', message: '' });
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  async function loadDashboard() {
    setLoadingDashboard(true);
    try {
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (error) {
      setScannerStatus({ type: 'error', message: error.message });
    } finally {
      setLoadingDashboard(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormStatus({ type: '', message: '' });

    try {
      const data = await createLead(form);
      setCreatedCoupon(data.coupon);
      setForm(emptyForm);
      setFormStatus({
        type: 'success',
        message: 'Datos guardados correctamente. El cupón ya quedó generado.'
      });
      loadDashboard();
    } catch (error) {
      setFormStatus({ type: 'error', message: error.message });
    }
  }

  async function runLookup(code) {
    setScannerStatus({ type: '', message: '' });
    setCouponResult(null);

    try {
      const data = await lookupCoupon(code);
      setCouponResult(data.coupon);
    } catch (error) {
      setScannerStatus({ type: 'error', message: error.message });
    }
  }

  async function handleLookup(event) {
    event.preventDefault();
    await runLookup(couponCode.trim());
  }

  async function handleCameraDetected(rawCode) {
    const normalizedCode = rawCode.trim().toUpperCase();
    setCouponCode(normalizedCode);
    setScannerStatus({
      type: 'success',
      message: `Código detectado: ${normalizedCode}`
    });
    await runLookup(normalizedCode);
  }

  async function handleRedeem() {
    setScannerStatus({ type: '', message: '' });

    try {
      const data = await redeemCoupon(couponCode.trim(), {
        redeemedBy: 'Operador sistema'
      });
      setCouponResult(data.coupon);
      setScannerStatus({
        type: 'success',
        message: 'Cupón canjeado y bloqueado correctamente.'
      });
      loadDashboard();
    } catch (error) {
      setScannerStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Sur Maderas</p>
        <h1>Formulario de ingreso al sistema</h1>
        <p className="hero-copy">
          Registrá datos para ingresar al sistema, entregá un cupón irrepetible y validalo desde el
          panel del lector para evitar usos duplicados.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <div className="card-header">
            <h2>Alta de datos</h2>
            <span>Genera un cupón único por registro</span>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <label>
              Nombre y apellido
              <input
                name="fullName"
                value={form.fullName}
                onChange={updateField}
                placeholder="Ej: Juan Pérez"
                required
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="juan@email.com"
                required
              />
            </label>

            <label>
              Teléfono
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="11 5555 5555"
                required
              />
            </label>

            <label>
              Ciudad
              <input
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="Buenos Aires"
              />
            </label>

            <label>
              Observaciones
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                placeholder="Comentarios comerciales o contexto"
                rows="4"
              />
            </label>

            <button type="submit">Guardar y generar cupón</button>
          </form>

          {formStatus.message ? (
            <p className={`status ${formStatus.type}`}>{formStatus.message}</p>
          ) : null}

          {createdCoupon ? (
            <div className="coupon-ticket">
              <span>Cupón generado</span>
              <strong>{createdCoupon.code}</strong>
              <small>Descuento: {createdCoupon.discountLabel}</small>
              <CouponVisualCodes code={createdCoupon.code} label="QR del cupón" />
            </div>
          ) : null}
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Lector de cupones</h2>
            <span>Consulta estado y bloquea al canjear</span>
          </div>

          <form className="stack compact" onSubmit={handleLookup}>
            <label>
              Código del cupón
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Ej: SURM-AB12CD34"
                required
              />
            </label>

            <div className="actions">
              <button type="submit">Buscar</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setCameraEnabled((current) => !current)}
              >
                {cameraEnabled ? 'Cerrar cámara' : 'Abrir cámara'}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={handleRedeem}
                disabled={!couponResult || couponResult.status === 'redeemed'}
              >
                Canjear y bloquear
              </button>
            </div>
          </form>

          <Suspense fallback={cameraEnabled ? <p className="muted">Cargando lector de cámara...</p> : null}>
            <CouponCameraScanner
              active={cameraEnabled}
              onDetected={handleCameraDetected}
              onError={() => {
                setScannerStatus({
                  type: 'error',
                  message: 'No se pudo cerrar correctamente el lector de cámara.'
                });
              }}
            />
          </Suspense>

          {scannerStatus.message ? (
            <p className={`status ${scannerStatus.type}`}>{scannerStatus.message}</p>
          ) : null}

          {couponResult ? (
            <>
              <div className="coupon-details">
                <div>
                  <span>Estado</span>
                  <strong>{couponResult.statusLabel}</strong>
                </div>
                <div>
                  <span>Cliente</span>
                  <strong>{couponResult.lead.fullName}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{couponResult.lead.email}</strong>
                </div>
                <div>
                  <span>Descuento</span>
                  <strong>{couponResult.discountLabel}</strong>
                </div>
                <div>
                  <span>Creado</span>
                  <strong>{couponResult.createdAtLabel}</strong>
                </div>
                <div>
                  <span>Canjeado por</span>
                  <strong>{couponResult.redeemedBy || 'Pendiente'}</strong>
                </div>
              </div>
              <CouponVisualCodes code={couponResult.code} label="QR del cupón consultado" />
            </>
          ) : (
            <p className="muted">
              Ingresá un código para revisar si está activo o si ya fue utilizado.
            </p>
          )}
        </article>
      </section>

      <section className="dashboard card">
        <div className="card-header">
          <h2>Resumen operativo</h2>
          <span>Control rápido de leads y cupones</span>
        </div>

        {loadingDashboard ? (
          <p className="muted">Cargando métricas...</p>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <span>Leads</span>
                <strong>{dashboard?.stats.totalLeads ?? 0}</strong>
              </div>
              <div className="stat">
                <span>Cupones activos</span>
                <strong>{dashboard?.stats.activeCoupons ?? 0}</strong>
              </div>
              <div className="stat">
                <span>Cupones canjeados</span>
                <strong>{dashboard?.stats.redeemedCoupons ?? 0}</strong>
              </div>
            </div>

            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Cupón</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentCoupons || []).map((item) => (
                    <tr key={item.code}>
                      <td>{item.createdAtLabel}</td>
                      <td>{item.lead.fullName}</td>
                      <td>{item.lead.email}</td>
                      <td>{item.code}</td>
                      <td>{item.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
