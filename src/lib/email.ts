import resend from "./resend";

export const sendVerificationEmail = async (email: string, code: string) => {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Verify your email",
    html: `<p>Your verification code: <strong>${code}</strong></p>`
  });
};