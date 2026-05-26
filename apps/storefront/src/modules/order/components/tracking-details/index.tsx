import type {
  OrderTrackingResponse,
  OrderTrackingShipment,
} from "@lib/data/orders"

type TrackingDetailsProps = {
  tracking: OrderTrackingResponse | null
}

const DELIVERED_RE = /^delivered$|rto delivered/i
const FAILED_RE = /undelivered|cancel|rto/i

const formatDateTime = (raw: string | null | undefined): string | null => {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const formatDate = (raw: string | null | undefined): string | null => {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString(undefined, { dateStyle: "medium" })
}

const StatusPill = ({ status }: { status: string | null }) => {
  if (!status) return null
  const lower = status.toLowerCase()
  const tone = DELIVERED_RE.test(lower)
    ? "bg-emerald-500 text-ink"
    : FAILED_RE.test(lower)
    ? "bg-red-500 text-surface"
    : "bg-accent text-ink"
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 border-ink px-3 py-1 font-family-heading text-[11px] font-bold uppercase tracking-[0.1em] ${tone}`}
    >
      {status}
    </span>
  )
}

const ShipmentBlock = ({ shipment }: { shipment: OrderTrackingShipment }) => {
  const scans = shipment.scan_history ?? []
  const eta = formatDate(shipment.expected_delivery_date)
  const statusTime = formatDateTime(shipment.status_time)
  const shippedAt = formatDateTime(shipment.shipped_at)
  const deliveredAt = formatDateTime(shipment.delivered_at)

  const summaryItems: Array<{ label: string; value: string | null }> = [
    { label: "Courier", value: shipment.courier },
    { label: "AWB / Tracking", value: shipment.tracking_number },
    { label: "Expected delivery", value: eta },
    { label: "Last update", value: statusTime },
    { label: "Shipped on", value: shippedAt },
    { label: "Delivered on", value: deliveredAt },
    {
      label: "Delivery agent",
      value:
        [shipment.delivery_partner_name, shipment.delivery_partner_phone]
          .filter(Boolean)
          .join(" • ") || null,
    },
  ].filter((it) => it.value)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusPill status={shipment.current_status} />
        {shipment.tracking_url ? (
          <a
            href={shipment.tracking_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center border-2 border-ink bg-ink px-4 py-2 font-family-heading text-xs font-bold uppercase tracking-[0.08em] text-surface transition-all hover:bg-surface hover:text-ink"
          >
            Open carrier tracking ↗
          </a>
        ) : null}
      </div>

      {summaryItems.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryItems.map((it) => (
            <div key={it.label} className="flex flex-col gap-1">
              <dt className="font-family-heading text-[11px] font-bold uppercase tracking-[0.1em] text-ink/45">
                {it.label}
              </dt>
              <dd className="font-family-base text-sm text-ink/85">
                {it.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {scans.length > 0 && (
        <div className="border-t-2 border-ink/15 pt-6">
          <h3 className="mb-4 font-family-heading text-sm font-bold uppercase tracking-[0.1em] text-ink/55">
            Scan history
          </h3>
          <ol className="flex flex-col gap-4">
            {scans.map((scan, idx) => {
              const isLatest = idx === 0
              return (
                <li
                  key={`${scan.date}-${idx}`}
                  className="flex gap-4 sm:gap-6"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 inline-block size-3 border-2 border-ink ${
                        isLatest ? "bg-accent" : "bg-surface"
                      }`}
                    />
                    {idx < scans.length - 1 && (
                      <span className="mt-1 h-full w-px flex-1 bg-ink/20" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 pb-2">
                    <p className="font-family-heading text-sm font-bold uppercase text-ink">
                      {scan.status || "Status update"}
                    </p>
                    <p className="font-family-base text-xs text-ink/55">
                      {[formatDateTime(scan.date), scan.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    {scan.remarks ? (
                      <p className="font-family-base text-xs text-ink/55">
                        {scan.remarks}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}

const TrackingDetails = ({ tracking }: TrackingDetailsProps) => {
  if (!tracking || !tracking.has_tracking) {
    return (
      <div>
        <h2 className="mb-3 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
          Tracking
        </h2>
        <p className="font-family-base text-sm text-ink/55">
          Tracking details will appear here once the courier picks up your
          parcel.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 font-family-heading text-2xl sm:text-3xl font-black uppercase text-ink">
        Tracking
      </h2>
      <div className="flex flex-col gap-10">
        {tracking.shipments.map((shipment) => (
          <ShipmentBlock
            key={shipment.fulfillment_id}
            shipment={shipment}
          />
        ))}
      </div>
    </div>
  )
}

export default TrackingDetails
