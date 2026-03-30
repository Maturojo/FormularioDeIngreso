function toLocalDate(dateValue) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(dateValue));
}

export function mapCouponRow(row) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    statusLabel: row.status === 'redeemed' ? 'Canjeado / bloqueado' : 'Activo',
    discountLabel: row.discountLabel,
    redeemedBy: row.redeemedBy,
    createdAt: row.createdAt,
    createdAtLabel: toLocalDate(row.createdAt),
    redeemedAt: row.redeemedAt,
    lead: {
      id: row.lead.id,
      fullName: row.lead.fullName,
      email: row.lead.email,
      phone: row.lead.phone,
      city: row.lead.city,
      notes: row.lead.notes
    }
  };
}
