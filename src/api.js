const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error inesperado');
  }

  return data;
}

export function createLead(payload) {
  return request('/leads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function lookupCoupon(code) {
  return request(`/coupons/${encodeURIComponent(code)}`);
}

export function redeemCoupon(code, payload) {
  return request(`/coupons/${encodeURIComponent(code)}/redeem`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchDashboard() {
  return request('/dashboard');
}
