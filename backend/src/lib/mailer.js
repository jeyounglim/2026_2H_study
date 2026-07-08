import nodemailer from 'nodemailer';
import { config, isEmailConfigured } from '../config/env.js';

let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

/**
 * 이메일 인증 메일 발송.
 * SMTP 설정이 없으면 실제로 보내지 않고 콘솔에 인증 링크를 출력한다(개발 편의).
 */
export async function sendVerificationEmail(to, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  if (!transporter) {
    console.log('\n[MAILER] SMTP 미설정 - 아래 링크로 이메일 인증을 진행하세요:');
    console.log(`[MAILER] to: ${to}`);
    console.log(`[MAILER] ${verifyUrl}\n`);
    return { delivered: false, verifyUrl };
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: '[Board] 이메일 인증을 완료해주세요',
    html: `
      <h2>이메일 인증</h2>
      <p>아래 버튼을 눌러 회원가입을 완료하세요. (링크는 24시간 후 만료됩니다)</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 18px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none;">이메일 인증하기</a></p>
      <p>또는 다음 링크를 브라우저에 붙여넣으세요:<br/>${verifyUrl}</p>
    `,
  });

  return { delivered: true, verifyUrl };
}
