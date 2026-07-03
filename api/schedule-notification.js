import { GoogleAuth } from 'google-auth-library';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { title, message, sendAfter, userId } = req.body || {};

  if (!title || !sendAfter || !userId) {
    return res.status(400).json({ error: 'Faltam dados (title, sendAfter, userId)' });
  }

  try {
    const tokenDoc = await db
      .collection('users')
      .doc(userId)
      .collection('meta')
      .doc('pushToken')
      .get();

    if (!tokenDoc.exists) {
      return res.status(404).json({ error: 'Token do dispositivo não encontrado' });
    }

    const fcmToken = tokenDoc.data().token;

    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const accessToken = await auth.getAccessToken();

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: title,
              body: message || title,
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data });
    }

    return res.status(200).json({ id: data.name });
  } catch (err) {
    console.error('Erro ao agendar notificação:', err);
    return res.status(500).json({ error: 'Erro ao agendar notificação' });
  }
}