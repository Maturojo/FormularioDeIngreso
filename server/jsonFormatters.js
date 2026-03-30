function toLocalDate(dateValue) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(dateValue));
}

export function mapCouponRow(row) {
  const lead = row.lead || {};

  return {
    id: row.id || row._id?.toString(),
    code: row.code,
    status: row.status,
    statusLabel: row.status === 'redeemed' ? 'Canjeado / bloqueado' : 'Activo',
    discountLabel: row.discountLabel,
    redeemedBy: row.redeemedBy,
    createdAt: new Date(row.createdAt).toISOString(),
    createdAtLabel: toLocalDate(row.createdAt),
    redeemedAt: row.redeemedAt ? new Date(row.redeemedAt).toISOString() : null,
    lead: {
      id: lead.id || lead._id?.toString(),
      fullName: lead.fullName || 'Lead sin datos',
      email: lead.email || '',
      phone: lead.phone || '',
      city: lead.city || '',
      notes: lead.notes || ''
    }
  };
}
