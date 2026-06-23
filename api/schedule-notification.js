export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { title, message, sendAfter } = req.body || {};
  if (!title || !sendAfter) {
    return res.status(400).json({ error: 'Faltam dados (title, sendAfter)' });
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ['Subscribed Users'],
        headings: { en: title },
        contents: { en: message || title },
        send_after: sendAfter,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.errors || data });
    }

    return res.status(200).json({ id: data.id });
  } catch {
    return res.status(500).json({ error: 'Erro ao agendar notificação' });
  }
}
