const express = require('express');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.urlencoded({ extended: false }));

// Credenciales Twilio
const accountSid = 'AC3daba58f9f53b859cd8e5d35483ecdda';
const authToken = '692c8e2d8fdbff3dfebd9ef9b37f75c4';
const twilioClient = twilio(accountSid, authToken);
const TWILIO_WA = 'whatsapp:+14155238886';

// Credenciales Supabase
const supabase = createClient(
  'https://jxyzgbhzgyztwdywwnnm.supabase.co',
  'sb_publishable_YU_sqjaSZlDXAFUnyFJIPg_jU2z17MB'
);

const URL_PLATAFORMA = 'https://referidos.enkelsumma.com';

// ─── WEBHOOK ──────────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  const msg = (req.body.Body || '').toLowerCase().trim();
  const from = req.body.From;

  let reply = '';

  // MENU
  if (['hola', 'hi', 'menu', 'inicio', '0', 'ayuda'].includes(msg)) {
    reply = `👋 ¡Hola! Soy el bot de *Referidos* — tu comunidad de confianza.

¿Qué quieres hacer?

1️⃣ *buscar* — buscar un referido
2️⃣ *agregar* — recomendar a alguien
3️⃣ *mercado* — ver el mercado de la comunidad

Escribe el número o la palabra clave.`;

  // BUSCAR
  } else if (msg === '1' || msg.startsWith('buscar')) {
    const query = msg.replace('buscar', '').trim();

    let dbQuery = supabase
      .from('referidos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (query) {
      dbQuery = dbQuery.or(
        `nombre.ilike.%${query}%,categoria.ilike.%${query}%,descripcion.ilike.%${query}%`
      );
    }

    const { data, error } = await dbQuery;

    if (error || !data || !data.length) {
      reply = `🔍 No encontré referidos${query ? ' para "' + query + '"' : ''}.

Puedes agregar el primero en:
🌐 ${URL_PLATAFORMA}

O escribe *menu* para ver más opciones.`;
    } else {
      const lista = data.map(r =>
        `👤 *${r.nombre}*\n` +
        `   ${r.descripcion || r.categoria}\n` +
        `   ✅ Recomendado por ${r.recomendado_por}\n` +
        `   _"${r.razon.substring(0, 70)}${r.razon.length > 70 ? '...' : ''}"_`
      ).join('\n\n');

      reply = `🔍 ${data.length} referido${data.length > 1 ? 's' : ''} encontrado${data.length > 1 ? 's' : ''}:\n\n${lista}\n\n🌐 Ver todos: ${URL_PLATAFORMA}`;
    }

  // AGREGAR
  } else if (msg === '2' || msg === 'agregar') {
    reply = `✚ *Agregar un referido*

Ve a la plataforma y usa el botón *"+ Agregar"*:

🌐 ${URL_PLATAFORMA}

Es rápido — solo nombre, categoría y por qué lo recomiendas. Queda visible para toda la comunidad.`;

  // MERCADO
  } else if (msg === '3' || msg === 'mercado') {
    reply = `🛒 *Mercado Referidos*

Compra y vende dentro de tu comunidad de confianza. Sin estafas — cada vendedor fue referido por alguien que conoces.

🌐 ${URL_PLATAFORMA}

Ve al tab *Mercado* para ver publicaciones o agregar la tuya.`;

  // NO ENTENDIDO
  } else {
    reply = `No entendí ese mensaje 😊

Escribe *menu* para ver las opciones disponibles.`;
  }

  // Enviar respuesta por Twilio
  try {
    await twilioClient.messages.create({
      from: TWILIO_WA,
      to: from,
      body: reply
    });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
  }

  res.status(200).send('OK');
});

// Health check
app.get('/', (req, res) => res.send('Bot Referidos activo ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot Referidos corriendo en puerto ${PORT}`));
