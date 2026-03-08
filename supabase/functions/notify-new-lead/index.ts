import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!
const TWILIO_FROM_PHONE = Deno.env.get('TWILIO_FROM_PHONE')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const OWNER_PHONE = Deno.env.get('OWNER_PHONE')!
const OWNER_EMAIL = Deno.env.get('OWNER_EMAIL')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')!

serve(async (req) => {
  try {
    const rawBody = await req.text()
    console.log('Raw request body:', rawBody)
    const payload = JSON.parse(rawBody)

    const lead = payload
    const {
      name = 'Unknown',
      phone = 'N/A',
      email = 'N/A',
      address = 'N/A',
      division = 'N/A',
      source = 'N/A',
    } = lead

    const messageBody =
      `New Lead - 42 Exteriors\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Address: ${address}\n` +
      `Division: ${division}\n` +
      `Source: ${source}`

    const [smsResult, emailResult] = await Promise.allSettled([
      sendSMS(messageBody),
      sendEmail({ name, phone, email, address, division, source }),
    ])

    const errors: string[] = []
    if (smsResult.status === 'rejected') errors.push(`SMS: ${smsResult.reason}`)
    if (emailResult.status === 'rejected') errors.push(`Email: ${emailResult.reason}`)

    if (errors.length > 0) {
      console.error('Notification errors:', errors.join('; '))
      return new Response(JSON.stringify({ error: errors }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

async function sendSMS(body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: OWNER_PHONE,
      From: TWILIO_FROM_PHONE,
      Body: body,
    }),
  })

  const twilioText = await res.text()
  console.log('Twilio response:', res.status, twilioText)
  if (!res.ok) {
    throw new Error(`Twilio error ${res.status}: ${twilioText}`)
  }
}

async function sendEmail(lead: {
  name: string
  phone: string
  email: string
  address: string
  division: string
  source: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `42 Exteriors CRM <${FROM_EMAIL}>`,
      to: [OWNER_EMAIL],
      subject: `New Lead: ${lead.name}`,
      html: `
        <h2 style="color:#1a1a1a">New Website Lead</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Name</td><td style="padding:6px 12px">${lead.name}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold;color:#555">Phone</td><td style="padding:6px 12px">${lead.phone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Email</td><td style="padding:6px 12px">${lead.email}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold;color:#555">Address</td><td style="padding:6px 12px">${lead.address}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Division</td><td style="padding:6px 12px">${lead.division}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:6px 12px;font-weight:bold;color:#555">Source</td><td style="padding:6px 12px">${lead.source}</td></tr>
        </table>
      `,
    }),
  })

  const resendText = await res.text()
  console.log('Resend response:', res.status, resendText)
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${resendText}`)
  }
}
