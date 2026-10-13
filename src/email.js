import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_3sx3vic';
const EMAILJS_TEMPLATE_ID = 'template_cncozac';
const EMAILJS_PUBLIC_KEY = 't6Ru_4hkxK4YfZl20';

function getTemplateMessage(templates, id, defaultSubject, defaultBody, vars) {
  const tpl = (templates || []).find(t => t.id === id) || { subject: defaultSubject, body: defaultBody };
  let subject = tpl.subject;
  let body = tpl.body;
  Object.keys(vars).forEach(key => {
    const val = vars[key] || "";
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), val);
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), val);
  });

  // Convert plain text newlines to HTML breaks and wrap in a modern colored card
  const htmlBody = body.replace(/\n/g, '<br/>');
  
  const modernHtmlMessage = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f5; padding: 20px;">
      <div style="background-color: #111111; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #FDD132; margin: 0; font-size: 28px; letter-spacing: 2px;">SPELLBOUND ( PUBLISHERS AND DISTRIBUTORS )</h1>
      </div>
      <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e4e4e7; border-top: none; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="color: #3f3f46; font-size: 16px; line-height: 1.8;">
          ${htmlBody}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center;">
          <p style="color: #71717a; font-size: 14px; margin: 0;">
            This is an automated message from <strong>SpellBound ( Publishers and Distributors )</strong>.<br/>
            Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, body: modernHtmlMessage };
}

async function send(email, to_name, subject, message) {
  console.log("📧 Sending email to:", email, "| Subject:", subject);
  const result = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    { email, to_name, subject, message },
    EMAILJS_PUBLIC_KEY
  );
  console.log("✅ Email sent:", result.status, result.text);
  return result;
}

export const sendTrialApprovalEmail = async (templates, trialRequest, generatedPassword, expirationDate) => {
  const { subject, body } = getTemplateMessage(
    templates,
    'trial_approved',
    "Your 30-Day Trial is Approved! 🎉",
    `Hello {{name}},\n\nYour trial request for SpellBound ( Publishers and Distributors ) has been approved!\n\nHere are your login details:\nLogin ID: {{id}}\nPassword: {{password}}\n\nThis trial gives you full access for 30 days and will expire on {{endDate}}.\n\nEnjoy reading!\n- The SpellBound ( Publishers and Distributors ) Team`,
    { name: trialRequest.name, id: trialRequest.id, password: generatedPassword, endDate: expirationDate }
  );
  try {
    await send(trialRequest.email, trialRequest.name, subject, body);
  } catch (err) {
    console.error("❌ Failed to send approval email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};

export const sendTrialRejectionEmail = async (templates, trialRequest) => {
  const { subject, body } = getTemplateMessage(
    templates,
    'trial_rejected',
    "Update on your Trial Request",
    `Hello {{name}},\n\nThank you for your interest in SpellBound ( Publishers and Distributors ). Unfortunately, we are unable to approve your trial request at this time.\n\nIf you believe this was a mistake or you are representing an institution, please reply to this email.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team`,
    { name: trialRequest.name }
  );
  try {
    await send(trialRequest.email, trialRequest.name, subject, body);
  } catch (err) {
    console.error("❌ Failed to send rejection email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};

export const sendInstitutionLicenseEmail = async (templates, email, name, licenseId, password, startDate, endDate) => {
  const { subject, body } = getTemplateMessage(
    templates,
    'institution_created',
    "Your Institution Access Details - SpellBound ( Publishers and Distributors )",
    `Hello {{name}},\n\nYour institution has been successfully registered on SpellBound ( Publishers and Distributors ).\n\nHere are your official access details:\nInstitution ID (Login): {{id}}\nPassword: {{password}}\n\nPurchasing Date: {{startDate}}\nExpiration Date: {{endDate}}\n\nYour members can use these credentials to read the books in your purchased catalog.\n\nBest regards,\n- The SpellBound ( Publishers and Distributors ) Team`,
    { name, id: licenseId, password, startDate, endDate }
  );
  try {
    await send(email, name, subject, body);
  } catch (err) {
    console.error("❌ Failed to send institution email:", err);
    alert("Email failed: " + (err?.text || err?.message || JSON.stringify(err)));
  }
};
