import { Resend } from 'resend';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';

const resend = new Resend(config.RESEND_API_KEY);

export async function sendSetupEmail(to: string, nome: string, token: string): Promise<void> {
  const link = `${config.DASHBOARD_URL}/auth/setup?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: 'Finza <noreply@resend.dev>',
      to,
      subject: '🪙 Configure sua senha — Finza',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #4ade80; font-size: 32px; margin-bottom: 8px;">finza</h1>
          <p style="color: #666; margin-bottom: 32px;">controle financeiro pessoal</p>
          
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Sua conta foi criada com sucesso. Clique no botão abaixo para definir sua senha e acessar o dashboard:</p>
          
          <a href="${link}" style="
            display: inline-block;
            margin: 24px 0;
            padding: 14px 28px;
            background: #4ade80;
            color: #0a0f0d;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          ">
            Definir minha senha
          </a>
          
          <p style="color: #999; font-size: 12px;">
            Link válido por 24 horas. Se você não criou uma conta no Finza, ignore este email.
          </p>
        </div>
      `,
    });

    logger.info({ response }, 'Email de setup enviado');
  } catch (err) {
    logger.error({ err }, 'Erro ao enviar email de setup');
  }
}