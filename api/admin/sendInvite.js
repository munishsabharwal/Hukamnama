
import { EmailClient } from "@azure/communication-email";

const emailClient = new EmailClient(process.env.ACS_CONN_STRING);
const FROM = process.env.FROM_EMAIL;

export async function POST(req, ctx){
  try {
    const { email, gurudwaraCodes } = await req.json();
    if(!email || !gurudwaraCodes?.length) return { status: 400, body: 'email and gurudwaraCodes required' };
    const link = `${process.env.PUBLIC_URL || ''}/.auth/login/externalid`;
    const poller = await emailClient.beginSend({
      senderAddress: FROM,
      content: { subject: 'Invitation to be Editor — Daily Hukamnamas', plainText: `You are invited to be an editor for: ${gurudwaraCodes.join(', ')}.
Sign in here: ${link}` },
      recipients: { to: [{ address: email }] }
    });
    await poller.pollUntilDone();
    return { status: 200, body: 'Invite sent' };
  } catch (e){ ctx.log('sendInvite error', e); return { status: 500, body: 'Email error' }; }
}
