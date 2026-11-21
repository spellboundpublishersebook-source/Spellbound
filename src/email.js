import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_3sx3vic';
const EMAILJS_TEMPLATE_ID = 'template_cncozac';
const EMAILJS_PUBLIC_KEY = 't6Ru_4hkxK4YfZl20';

export const COMPANY_LOGO_URL = 'https://cdn.jsdelivr.net/gh/spellboundpublishersebook-source/Spellbound@main/public/logo.png';

export function getWebsiteUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://spellboundpublishers.com';
}

/**
 * Renders a responsive, cross-client HTML email template with company logo,
 * clean typography, highlighted access credentials, and fallback plain text.
 */
export function renderEmailHtml(rawSubject, rawBody, vars = {}) {
  let subject = rawSubject || "Notification from SpellBound";
  let body = rawBody || "";

  const websiteUrl = vars.websiteUrl || vars.portalUrl || getWebsiteUrl();
  vars.websiteUrl = websiteUrl;
  vars.portalUrl = websiteUrl;

  // 1. Normalize linebreaks (handling literal \r\n, \n, or escaped string literals from JSON/DB)
  body = body
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  // 2. Replace template variables
  Object.keys(vars).forEach(key => {
    const val = vars[key] != null ? String(vars[key]) : "";
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, val);
    body = body.replace(regex, val);
  });

  // 3. Format paragraphs and identify credentials
  const paragraphs = body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  const htmlParagraphs = paragraphs.map(p => {
    // If paragraph contains login credentials, format in a dedicated high-contrast credentials box
    const isCredentials = /Login ID:|Institution ID|Password:/i.test(p);
    if (isCredentials) {
      const lines = p.split('\n');
      const formattedLines = lines.map(line => {
        if (line.includes(':')) {
          const colonIndex = line.indexOf(':');
          const label = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();
          return `
            <div style="margin: 6px 0; font-size: 14px;">
              <span style="color: #4b5563; font-weight: 600;">${label}:</span>
              <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 15px; font-weight: 700; color: #111827; background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 2px 8px; border-radius: 4px; margin-left: 6px; letter-spacing: 0.5px;">${value}</span>
            </div>
          `;
        }
        return `<div style="margin: 4px 0; color: #374151;">${line}</div>`;
      }).join('');

      return `
        <div style="background-color: #fafafa; border: 1px solid #e5e7eb; border-left: 4px solid #DC2626; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #DC2626; margin-bottom: 8px;">Access Credentials</div>
          ${formattedLines}
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
            <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #F5F23B; color: #111214; font-weight: 800; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 2px 5px rgba(0,0,0,0.08);">
              👉 Click Here to Open Reader &amp; Sign In
            </a>
            <div style="margin-top: 8px; font-size: 12px; color: #4b5563;">
              Website Portal: <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-weight: 600; text-decoration: underline; word-break: break-all;">${websiteUrl}</a>
            </div>
          </div>
        </div>
      `;
    }

    // Standard paragraph: preserve single line breaks and make URLs clickable
    const formattedText = p.replace(/\n/g, '<br/>').replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-weight: 600; text-decoration: underline;">$1</a>'
    );
    return `<p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.65;">${formattedText}</p>`;
  }).join('');

  // 4. Wrap in a clean, email-client compliant responsive HTML table layout
  const htmlDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
          
          <!-- BRAND HEADER WITH COMPANY LOGO -->
          <tr>
            <td align="center" style="background-color: #111111; padding: 28px 20px 24px 20px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; text-align: center;">
                <tr>
                  <td align="center">
                    <img 
                      src="${COMPANY_LOGO_URL}" 
                      alt="SpellBound Logo" 
                      width="120" 
                      style="width: 120px; max-width: 120px; height: auto; display: block; margin: 0 auto 12px auto; border: 0;"
                    />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="color: #DC2626; font-size: 26px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1;">
                      SPELLBOUND
                    </div>
                    <div style="color: #ffffff; font-size: 12px; font-weight: 600; font-style: italic; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 5px;">
                      Publishers &amp; Distributors
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- EMAIL BODY -->
          <tr>
            <td style="padding: 32px 28px 24px 28px; background-color: #ffffff; text-align: left;">
              ${htmlParagraphs}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color: #fafafa; padding: 20px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 500;">
                This is an automated message from <strong>SpellBound (Publishers &amp; Distributors)</strong>.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Please do not reply directly to this email. For questions or renewals, contact support.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version (stripping all tags for clean fallback)
  const plainText = body.replace(/<[^>]+>/g, '').trim();

  return { subject, html: htmlDoc, text: plainText };
}

function getTemplateMessage(templates, id, defaultSubject, defaultBody, vars) {
  const tpl = (templates || []).find(t => t.id === id) || { subject: defaultSubject, body: defaultBody };
  return renderEmailHtml(tpl.subject || defaultSubject, tpl.body || defaultBody, vars);
}

async function send(email, to_name, subject, htmlBody, plainText) {
  console.log("📧 Sending email to:", email, "| Subject:", subject);
  
  const websiteUrl = getWebsiteUrl();

  // Pass both HTML and Plain Text options so the EmailJS template renders cleanly
  // whether configured with {{{message}}} (HTML unescaped) or text variables.
  const templateParams = {
    email: email,
    to_email: email,
    recipient_email: email,
    to_name: to_name,
    name: to_name,
    subject: subject,
    message: htmlBody,              // In EmailJS template: use {{{message}}} for HTML
    html_message: htmlBody,         // For templates using {{{html_message}}}
    message_html: htmlBody,         // For templates using {{{message_html}}}
    plain_message: plainText,       // For templates using {{plain_message}}
    text_message: plainText,        // For templates using {{text_message}}
    content: htmlBody,
    logo_url: COMPANY_LOGO_URL,
    website_url: websiteUrl,
    portal_url: websiteUrl,
    portal_link: websiteUrl,
    company_name: "SpellBound (Publishers & Distributors)"
  };

  const result = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    templateParams,
    EMAILJS_PUBLIC_KEY
  );
  console.log("✅ Email sent:", result.status, result.text);
  return result;
}

export const sendTrialApprovalEmail = async (templates, trialRequest, generatedPassword, expirationDate) => {
  const websiteUrl = getWebsiteUrl();
  const { subject, html, text } = getTemplateMessage(
    templates,
    'trial_approved',
    "Your 30-Day Trial is Approved! 🎉",
    `Hello {{name}},\n\nYour trial request for SpellBound (Publishers and Distributors) has been approved!\n\nWebsite / Reader Portal:\n{{websiteUrl}}\n\nHere are your login details:\nLogin ID: {{id}}\nPassword: {{password}}\n\nThis trial gives you full access for 30 days and will expire on {{endDate}}.\n\nEnjoy reading!\n- The SpellBound (Publishers and Distributors) Team`,
    { name: trialRequest.name, id: trialRequest.id, password: generatedPassword, endDate: expirationDate, websiteUrl }
  );
  try {
    await send(trialRequest.email, trialRequest.name, subject, html, text);
  } catch (err) {
    console.error("❌ Failed to send approval email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};

export const sendTrialRejectionEmail = async (templates, trialRequest) => {
  const websiteUrl = getWebsiteUrl();
  const { subject, html, text } = getTemplateMessage(
    templates,
    'trial_rejected',
    "Update on your Trial Request",
    `Hello {{name}},\n\nThank you for your interest in SpellBound (Publishers and Distributors). Unfortunately, we are unable to approve your trial request at this time.\n\nWebsite:\n{{websiteUrl}}\n\nIf you believe this was a mistake or you are representing an institution, please reply to this email to get in touch with our team.\n\nBest regards,\n- The SpellBound (Publishers and Distributors) Team`,
    { name: trialRequest.name, websiteUrl }
  );
  try {
    await send(trialRequest.email, trialRequest.name, subject, html, text);
  } catch (err) {
    console.error("❌ Failed to send rejection email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};

export const sendInstitutionLicenseEmail = async (templates, email, name, licenseId, password, startDate, endDate) => {
  const websiteUrl = getWebsiteUrl();
  const { subject, html, text } = getTemplateMessage(
    templates,
    'institution_created',
    "Your Institution Access Details - SpellBound (Publishers and Distributors)",
    `Hello {{name}},\n\nYour institution has been successfully registered on SpellBound (Publishers and Distributors).\n\nWebsite / Reader Portal:\n{{websiteUrl}}\n\nHere are your official access details:\nInstitution ID (Login): {{id}}\nPassword: {{password}}\n\nPurchasing Date: {{startDate}}\nExpiration Date: {{endDate}}\n\nYour members can use these credentials to sign in and read the books in your purchased catalog at {{websiteUrl}}.\n\nBest regards,\n- The SpellBound (Publishers and Distributors) Team`,
    { name, id: licenseId, password, startDate, endDate, websiteUrl }
  );
  try {
    await send(email, name, subject, html, text);
  } catch (err) {
    console.error("❌ Failed to send institution email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};

export const sendIndividualReaderEmail = async (templates, email, name, loginId, password, startDate, endDate) => {
  const websiteUrl = getWebsiteUrl();
  const { subject, html, text } = getTemplateMessage(
    templates,
    'individual_created',
    "Your Reading Access Details - SpellBound (Publishers and Distributors)",
    `Hello {{name}},\n\nYour individual reading access for SpellBound (Publishers and Distributors) is active!\n\nWebsite / Reader Portal:\n{{websiteUrl}}\n\nHere are your official access details:\nLogin ID: {{id}}\nPassword: {{password}}\n\nStart Date: {{startDate}}\nExpiration Date: {{endDate}}\n\nYou can use these credentials to sign in and read your authorized catalog of books at {{websiteUrl}}.\n\nBest regards,\n- The SpellBound (Publishers and Distributors) Team`,
    { name, id: loginId, password, startDate, endDate, websiteUrl }
  );
  try {
    await send(email, name, subject, html, text);
  } catch (err) {
    console.error("❌ Failed to send individual reader email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};
