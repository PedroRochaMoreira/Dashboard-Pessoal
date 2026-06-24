export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { notificationId } = req.body || {};
  if (!notificationId) {
    return res.status(400).json({ error: 'Faltam dados (notificationId)' });
  }

  try {
    const url = `https://api.onesignal.com/notifications/${notificationId}?app_id=${process.env.ONESIGNAL_APP_ID}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Já enviada ou já cancelada não é um erro real pro usuário.
      return res.status(200).json({ ok: false, detail: data });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Erro ao cancelar notificação' });
  }
}
