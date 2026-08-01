import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ⚙️ Este es el Token que Meta nos dará cuando creemos la App de WhatsApp
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'TU_TOKEN_DE_META'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || 'TU_ID_DE_TELEFONO'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, message, target, metadata } = body

    // 1. OBTENER LOS DESTINATARIOS DE SUPABASE
    let query = supabase.from('usuarios').select('telefono').not('telefono', 'is', null)
    
    // Segmentación Avanzada (Ej. Solo TI, o Solo Tiempo Completo)
    if (target === 'TI') query = query.contains('departments', ['TI'])
    if (target === 'CAE') query = query.contains('departments', ['CAE'])
    if (target === 'DIRECTIVOS') query = query.eq('is_superadmin', true)

    const { data: users, error } = await query
    
    if (error || !users) {
      return NextResponse.json({ error: 'Error obteniendo destinatarios' }, { status: 500 })
    }

    // 2. CONSTRUCCIÓN DEL MENSAJE INTERACTIVO
    const phoneNumbers = users.map(u => u.telefono)
    const responses = []

    for (const phone of phoneNumbers) {
      let payload: any = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      }

      // Si es una Caída Masiva, inyectamos el botón de Resolver
      if (type === 'INCIDENTE_CRITICO') {
        payload = {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: `🚨 *NUEVA CAÍDA MASIVA*\n\n*Afectación:* ${metadata.departamento}\n*Falla:* ${metadata.titulo}\n\nRevisa los detalles en Exodus.` },
            action: {
              buttons: [
                { type: 'reply', reply: { id: `resolve_${metadata.id}`, title: '✅ Resolver' } },
                { type: 'reply', reply: { id: `view_${metadata.id}`, title: '👀 Ver Detalles' } }
              ]
            }
          }
        }
      }

      // 3. DISPARAR A LA API DE META
      /* const res = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      responses.push(await res.json())
      */
     
      // Simulación exitosa por ahora hasta que pongamos el Token real
      responses.push({ status: 'Simulado', phone })
    }

    return NextResponse.json({ success: true, deliveredTo: responses.length, responses })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}