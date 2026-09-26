import { Resend } from 'resend';

export const getMailer = (user, pass) => {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const resend = new Resend(resendApiKey);

  return {
    sendMail: async (options) => {
      const defaultFromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev';
      const fromName = process.env.APP_NAME || 'A Story By Pavan';
      
      let formattedFrom = options.from;
      if (!formattedFrom || formattedFrom.includes('undefined') || formattedFrom.includes('null') || formattedFrom.includes('<>')) {
        formattedFrom = `${fromName} <${defaultFromEmail}>`;
      }

      // Handle multiple recipients
      let toArray = [];
      if (Array.isArray(options.to)) {
        toArray = options.to;
      } else if (typeof options.to === 'string') {
        toArray = options.to.split(',').map(e => e.trim()).filter(e => e && e !== 'undefined' && e !== 'null');
      } else if (options.to) {
        toArray = [options.to];
      }

      if (toArray.length === 0) {
        console.warn('No valid recipient provided for email:', options.subject);
        return { messageId: 'no-recipient-skipped' };
      }

      const resendOptions = {
        from: formattedFrom,
        to: toArray,
        subject: options.subject,
      };

      if (options.text) resendOptions.text = options.text;
      if (options.html) resendOptions.html = options.html;
      if (options.replyTo || options.reply_to) resendOptions.reply_to = options.replyTo || options.reply_to;
      if (options.attachments) resendOptions.attachments = options.attachments;

      if (!resendApiKey) {
        console.warn('RESEND_API_KEY is not set. Simulating success for:', options.subject);
        return { messageId: 'simulated-id' };
      }

      try {
        const { data, error } = await resend.emails.send(resendOptions);

        if (error) {
          console.error('Resend API Error:', error);
          return { error: error.message || 'Failed to send email via Resend' };
        }

        console.log(`Email successfully sent via Resend to ${toArray.join(', ')} (ID: ${data?.id})`);
        return { messageId: data?.id };
      } catch (err) {
        console.error('Error executing Resend email send:', err);
        return { error: err.message };
      }
    }
  };
};

export const sendEmail = async (options) => {
  const mailer = getMailer();
  return await mailer.sendMail(options);
};
