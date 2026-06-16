import { renderTicketPdf } from "../src/modules/smtp-notification/ticket-pdf.ts"
import { writeFileSync } from "fs"
const ev = { partner: "Monsoon Coffee Co.", venue: "The Roastery", city: "Chennai", date_label: "Wednesday, December 23rd", start_time: "17:00", end_time: "19:00" }
const pdf = await renderTicketPdf({
  display_id: 56, email: "test@example.com",
  tickets: [
    { title: "Test Ticket", code: "MC-EVT-56-9A7BE66F33", unit: 1, count: 3, verifyUrl: "https://monsooncoffee.co/verify/MC-EVT-56-9A7BE66F33", event: ev },
    { title: "Cupping & Tasting Session", code: "MC-EVT-56-B2K1ZZ0099", unit: 2, count: 3, verifyUrl: "https://monsooncoffee.co/verify/MC-EVT-56-B2K1ZZ0099", event: ev },
  ],
})
writeFileSync(".preview/ticket-sample.pdf", pdf)
console.log("wrote apps/backend/.preview/ticket-sample.pdf", pdf.length, "bytes")
