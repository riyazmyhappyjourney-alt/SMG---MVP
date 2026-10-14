import { executeQuery } from '../db/pool';
import { recordAuditEvent } from '../audit/logger';
import { AuthenticatedUser } from '../../core/types/auth';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

export interface EmailTemplateRecord {
  template_key: string;
  subject_template: string;
  html_template: string;
  plain_text_template: string;
  is_active: boolean;
  updated_at: string;
}

export interface PublicationNotificationRecord {
  id: string;
  property_id: string | null;
  recipient_email: string;
  subject: string;
  html_body: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING_CONFIGURATION' | 'SIMULATED';
  idempotency_key: string;
  event_type?: 'PROPERTY_LISTED' | 'MEETING_SCHEDULED' | 'PROPERTY_APPROVED' | 'PROPERTY_PUBLISHED' | 'USER_WELCOME' | 'INTERNAL_PROPERTY_INTAKE' | 'TEST';
  provider_message_id?: string | null;
  provider_response?: string | null;
  error_message?: string | null;
  delivery_attempts?: number;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string or raw string
  contentType?: string;
}

export type MockEmailProvider = (payload: {
  to: string;
  from: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  eventType: string;
}) => Promise<{ success: boolean; messageId?: string; error?: string }>;

// ====================================================================
// 0. CENTRALIZED EMAIL SENDER & BRAND IDENTITY CONFIGURATION
// ====================================================================

export interface EmailSenderConfig {
  displayName: string;
  senderEmail: string;
  onboardingDisplayName: string;
  onboardingSenderEmail: string;
  supportEmail: string;
  replyToEmail: string;
  legalOffice: string;
}

export const EMAIL_SENDER_CONFIG: EmailSenderConfig = {
  displayName: process.env.EMAIL_SENDER_NAME || 'SellMyGhar.in',
  senderEmail: process.env.EMAIL_SENDER_ADDRESS || 'notifications@sellmyghar.in',
  onboardingDisplayName: process.env.EMAIL_ONBOARDING_SENDER_NAME || 'SellMyGhar Onboarding',
  onboardingSenderEmail: process.env.EMAIL_ONBOARDING_SENDER_ADDRESS || 'onboarding@sellmyghar.in',
  supportEmail: 'support@sellmyghar.in',
  replyToEmail: process.env.EMAIL_REPLY_TO || 'support@sellmyghar.in',
  legalOffice: 'ESTEEM PARK, Rose Garden Rd, 5th Phase, J P Nagar Phase 5, J. P. Nagar, Bengaluru, Karnataka 560078',
};

export function getFormattedSender(type: 'DEFAULT' | 'ONBOARDING' | 'SUPPORT' = 'DEFAULT'): string {
  if (type === 'DEFAULT') {
    return process.env.RESEND_FROM_EMAIL || `${EMAIL_SENDER_CONFIG.displayName} <${EMAIL_SENDER_CONFIG.senderEmail}>`;
  }
  if (type === 'ONBOARDING') {
    return process.env.RESEND_ONBOARDING_FROM_EMAIL || `${EMAIL_SENDER_CONFIG.onboardingDisplayName} <${EMAIL_SENDER_CONFIG.onboardingSenderEmail}>`;
  }
  return `${EMAIL_SENDER_CONFIG.displayName} <${EMAIL_SENDER_CONFIG.supportEmail}>`;
}

// ====================================================================
// 1. DEFAULT EMAIL TEMPLATES (4 Required Workflows)
// ====================================================================

export const DEFAULT_PUBLISHED_EMAIL_SUBJECT = 'New Verified Resale Listing: {{property_title}} in {{locality}}';

export const DEFAULT_PUBLISHED_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{property_title}}</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px 12px; color: #172033; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
    .header { background: #172033; padding: 24px 32px; text-align: left; border-bottom: 3px solid #244B8F; }
    .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #38BDF8; }
    .sub-brand { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; margin-top: 4px; }
    .cover-wrap { width: 100%; height: 260px; background-color: #0F172A; position: relative; overflow: hidden; }
    .cover-img { width: 100%; height: 100%; object-fit: cover; }
    .body { padding: 32px; }
    .badge-pill { display: inline-block; padding: 4px 12px; background: #EFF6FF; border: 1px solid #BFDBFE; color: #244B8F; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #172033; margin: 0 0 16px 0; line-height: 1.3; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; border: 1px solid #EDF2F7; }
    .spec-item { font-size: 13px; color: #64748B; }
    .spec-item strong { display: block; font-size: 15px; color: #0F172A; margin-top: 2px; }
    .price-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 20px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
    .price-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #166534; }
    .price-value { font-size: 24px; font-weight: 800; color: #15803D; }
    .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
    .btn-wrap { text-align: center; margin: 30px 0 10px 0; }
    .btn { display: inline-block; background: #244B8F; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(36,75,143,0.3); }
    .footer { background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.5; }
    .footer a { color: #244B8F; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">SellMy<span>Ghar</span>.in</div>
      <div class="sub-brand">Bengaluru Residential Resale Advisory</div>
    </div>

    <div class="cover-wrap">
      <img src="{{cover_image_url}}" alt="{{property_title}}" class="cover-img" />
    </div>

    <div class="body">
      <div class="badge-pill">Verified Resale Listing</div>
      <h1>{{property_title}}</h1>

      <div class="price-box">
        <div>
          <div class="price-label">Approved Asking Price</div>
          <div class="price-value">{{public_price}}</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748B;">
          Verified Title &bull; Zero Broker Spam
        </div>
      </div>

      <div class="spec-grid">
        <div class="spec-item">Locality &bull; Zone<strong>{{locality}}</strong></div>
        <div class="spec-item">Configuration<strong>{{bhk}} &bull; {{property_type}}</strong></div>
        <div class="spec-item">Super Built-up Area<strong>{{area}}</strong></div>
        <div class="spec-item">Platform Status<strong>Publicly Discoverable</strong></div>
      </div>

      <p class="desc">
        This property has completed primary documentation checks and is now discoverable on the SellMyGhar resale platform. Verified buyers can request physical escorted site tours directly.
      </p>

      <div class="btn-wrap">
        <a href="{{property_url}}" class="btn" target="_blank">View Verified Property Details &rarr;</a>
      </div>
    </div>

    <div class="footer">
      <p>This notification was dispatched by SellMyGhar Operations (notifications@sellmyghar.in).</p>
      <p>100% RERA compliant &bull; Form 15 EC Title Diligence &bull; Bengaluru, Karnataka</p>
      <p style="margin-top: 12px;">
        <a href="https://sellmyghar.in/#/consent">Manage Communication Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_SUBMISSION_EMAIL_SUBJECT = 'Your property has been submitted | SellMyGhar.in';

export const DEFAULT_SUBMISSION_EMAIL_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your property has been submitted | SellMyGhar.in</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;font-size:1px;color:#f4f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Thanks for submitting your property on SellMyGhar.in. Here’s what happens next.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f6f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e8edf3;">
              <div style="font-size:27px;line-height:32px;font-weight:800;letter-spacing:-1px;color:#244b8f;">
                SellMyGhar<span style="color:#b68a4a;">.in</span>
              </div>
              <div style="padding-top:5px;font-size:10px;letter-spacing:2px;color:#65748b;">SELL&nbsp; / &nbsp;RENT&nbsp; / &nbsp;INVEST</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 28px 30px;background:#eef4fb;">
              <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#b68a4a;">Property submission received</div>
              <h1 style="margin:12px 0 14px;font-size:32px;line-height:39px;letter-spacing:-.6px;color:#244b8f;">Welcome to SellMyGhar.in</h1>
              <p style="margin:0;font-size:16px;line-height:26px;color:#34445b;">Hi {{customer_name}}, thank you for submitting your property. We’ve received your details and will review the information before updating you on the next steps.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h2 style="margin:0 0 14px;font-size:19px;line-height:26px;color:#172033;">Your submitted property</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f9fc;border:1px solid #e5ebf3;border-radius:8px;">
                <tr>
                  <td style="padding:18px;">
                    <div style="font-size:11px;line-height:17px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">Submission reference</div>
                    <div style="padding-top:4px;font-size:17px;line-height:24px;font-weight:700;color:#244b8f;">{{property_reference}}</div>
                    <div style="padding-top:14px;font-size:14px;line-height:22px;color:#172033;"><strong>Property:</strong> {{property_type}}</div>
                    <div style="font-size:14px;line-height:22px;color:#172033;"><strong>Location:</strong> {{property_location}}</div>
                    <div style="font-size:14px;line-height:22px;color:#172033;"><strong>Listing type:</strong> {{listing_type}}</div>
                  </td>
                </tr>
              </table>
              <h2 style="margin:28px 0 14px;font-size:19px;line-height:26px;color:#172033;">What happens next?</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="top" width="34" style="padding:0 10px 14px 0;">
                    <div style="width:28px;height:28px;border-radius:14px;background:#e6efff;color:#244b8f;text-align:center;font-size:14px;line-height:28px;font-weight:700;">1</div>
                  </td>
                  <td valign="top" style="padding:3px 0 14px;">
                    <div style="font-size:15px;line-height:21px;font-weight:700;color:#172033;">We review your details</div>
                    <div style="padding-top:3px;font-size:14px;line-height:21px;color:#64748b;">Our team checks the submitted information and may contact you if anything needs clarification.</div>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="34" style="padding:0 10px 14px 0;">
                    <div style="width:28px;height:28px;border-radius:14px;background:#e6efff;color:#244b8f;text-align:center;font-size:14px;line-height:28px;font-weight:700;">2</div>
                  </td>
                  <td valign="top" style="padding:3px 0 14px;">
                    <div style="font-size:15px;line-height:21px;font-weight:700;color:#172033;">We update you on the status</div>
                    <div style="padding-top:3px;font-size:14px;line-height:21px;color:#64748b;">We’ll let you know about the next step using the contact details you provided.</div>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="34" style="padding:0 10px 0 0;">
                    <div style="width:28px;height:28px;border-radius:14px;background:#e6efff;color:#244b8f;text-align:center;font-size:14px;line-height:28px;font-weight:700;">3</div>
                  </td>
                  <td valign="top" style="padding:3px 0 0;">
                    <div style="font-size:15px;line-height:21px;font-weight:700;color:#172033;">Publication &amp; Buyer Match</div>
                    <div style="padding-top:3px;font-size:14px;line-height:21px;color:#64748b;">Your listing goes live with verified buyers alerted across Bengaluru.</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:28px;text-align:center;">
                <a href="{{dashboard_url}}" style="display:inline-block;padding:12px 24px;background:#244b8f;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">View in Dashboard</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;background:#f8fafc;border-top:1px solid #e8edf3;text-align:center;font-size:12px;line-height:18px;color:#64748b;">
              &copy; {{year}} SellMyGhar.in. Bengaluru, Karnataka. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const DEFAULT_MEETING_EMAIL_SUBJECT = 'Site Visit Confirmed: {{property_title}} on {{meeting_date}} at {{meeting_time}} (IST)';

export const DEFAULT_MEETING_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Visit Confirmed | SellMyGhar.in</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px 12px; color: #172033; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
    .header { background: #172033; padding: 24px 32px; text-align: left; border-bottom: 3px solid #244B8F; }
    .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #38BDF8; }
    .sub-brand { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; margin-top: 4px; }
    .body { padding: 32px; }
    .badge-pill { display: inline-block; padding: 4px 12px; background: #EFF6FF; border: 1px solid #BFDBFE; color: #244B8F; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #172033; margin: 0 0 16px 0; line-height: 1.3; }
    .meeting-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .meeting-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; }
    .meeting-row:last-child { border-bottom: none; }
    .meeting-label { color: #64748B; font-weight: 600; }
    .meeting-val { color: #0F172A; font-weight: 700; text-align: right; }
    .ics-banner { background: #EFF6FF; border: 1px dashed #93C5FD; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #1E40AF; margin: 20px 0; line-height: 1.5; }
    .btn-wrap { text-align: center; margin: 24px 0 10px 0; }
    .btn { display: inline-block; background: #244B8F; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; }
    .footer { background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">SellMy<span>Ghar</span>.in</div>
      <div class="sub-brand">Bengaluru Residential Resale Advisory</div>
    </div>
    <div class="body">
      <div class="badge-pill">Site Visit Confirmed</div>
      <h1>Meeting Scheduled: {{property_title}}</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
        Hi {{client_name}}, your property inspection and assisted walkthrough has been scheduled with SellMyGhar Operations.
      </p>
      <div class="meeting-card">
        <div class="meeting-row">
          <span class="meeting-label">Date</span>
          <span class="meeting-val">{{meeting_date}}</span>
        </div>
        <div class="meeting-row">
          <span class="meeting-label">Time</span>
          <span class="meeting-val">{{meeting_time}} (IST)</span>
        </div>
        <div class="meeting-row">
          <span class="meeting-label">Timezone</span>
          <span class="meeting-val">{{meeting_timezone}}</span>
        </div>
        <div class="meeting-row">
          <span class="meeting-label">Meeting Location</span>
          <span class="meeting-val">{{meeting_location}}</span>
        </div>
        <div class="meeting-row">
          <span class="meeting-label">Assigned Specialist</span>
          <span class="meeting-val">{{specialist_name}}</span>
        </div>
      </div>
      <div class="ics-banner">
        📅 <strong>Calendar Invitation Attached:</strong> A standard .ics calendar invitation is attached to this email. Click &quot;Add to Calendar&quot; to automatically synchronize with Google Calendar, Apple Calendar, or Microsoft Outlook.
      </div>
      <div class="btn-wrap">
        <a href="{{dashboard_url}}" class="btn">View in CRM Dashboard</a>
      </div>
    </div>
    <div class="footer">
      &copy; {{year}} SellMyGhar.in &bull; Bengaluru, Karnataka &bull; Direct Resale Advisory
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_APPROVED_EMAIL_SUBJECT = 'Property Verified & Approved: {{property_title}} | SellMyGhar.in';

export const DEFAULT_APPROVED_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Verified &amp; Approved | SellMyGhar.in</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px 12px; color: #172033; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
    .header { background: #172033; padding: 24px 32px; text-align: left; border-bottom: 3px solid #244B8F; }
    .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #38BDF8; }
    .sub-brand { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; margin-top: 4px; }
    .body { padding: 32px; }
    .badge-pill { display: inline-block; padding: 4px 12px; background: #DCFCE7; border: 1px solid #86EFAC; color: #166534; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #172033; margin: 0 0 16px 0; line-height: 1.3; }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; border: 1px solid #EDF2F7; }
    .spec-item { font-size: 13px; color: #64748B; }
    .spec-item strong { display: block; font-size: 15px; color: #0F172A; margin-top: 2px; }
    .highlight-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .btn-wrap { text-align: center; margin: 24px 0 10px 0; }
    .btn { display: inline-block; background: #244B8F; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; }
    .footer { background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">SellMy<span>Ghar</span>.in</div>
      <div class="sub-brand">Bengaluru Residential Resale Advisory</div>
    </div>
    <div class="body">
      <div class="badge-pill">&#10003; Verification Complete</div>
      <h1>Your Property Has Been Approved</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
        Hi {{customer_name}}, primary title diligence and documentation review have passed. Your property is approved for the SellMyGhar resale platform.
      </p>
      <div class="highlight-box">
        <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #166534;">Verified Asking Price</div>
        <div style="font-size: 24px; font-weight: 800; color: #15803D; margin-top: 2px;">{{public_price}}</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Form 15 EC Title Diligence &bull; Level 2 Document Verification Passed</div>
      </div>
      <div class="spec-grid">
        <div class="spec-item">Reference<strong>{{property_reference}}</strong></div>
        <div class="spec-item">Locality<strong>{{locality}}</strong></div>
        <div class="spec-item">Configuration<strong>{{bhk}} &bull; {{property_type}}</strong></div>
        <div class="spec-item">Super Built-up Area<strong>{{area}}</strong></div>
      </div>
      <p style="font-size: 13px; color: #475569; line-height: 1.6;">
        Next step: Our listing specialists are preparing your high-converting property presentation. You will be alerted the moment verified buyers submit tour requests.
      </p>
      <div class="btn-wrap">
        <a href="{{dashboard_url}}" class="btn">View in Dashboard</a>
      </div>
    </div>
    <div class="footer">
      &copy; {{year}} SellMyGhar.in &bull; Bengaluru, Karnataka &bull; Direct Resale Advisory
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_EMAIL_SAMPLE_VARS: Record<string, string> = {
  customer_name: 'Ananya Sharma',
  owner_name: 'Ananya Sharma',
  client_name: 'Ananya Sharma',
  specialist_name: 'Rajesh Kumar (Senior Resale Specialist)',
  property_reference: 'SMG-BLR-2026-8841',
  submission_id: 'SMG-BLR-2026-8841',
  property_title: '3BHK Lakeview Penthouse in Sobha Dream Acres',
  property_type: '3 BHK Flat / Apartment',
  property_location: 'Varthur / Whitefield, Bengaluru',
  locality: 'Whitefield',
  bhk: '3BHK',
  area: '1,650 sq.ft',
  listing_type: 'Assisted Resale (Verified)',
  public_price: '₹1.45 Cr',
  meeting_date: 'Thursday, 15 Oct 2026',
  meeting_time: '11:00 AM',
  meeting_timezone: 'Asia/Kolkata (IST, UTC+05:30)',
  meeting_location: 'Sobha Dream Acres, Panathur Road, Varthur, Bengaluru',
  verification_tier: 'Level 2 Documents Verified (Form 15 EC)',
  dashboard_url: 'https://sellmyghar.in/#/dashboard',
  property_url: 'https://sellmyghar.in/#/property/sample-test-01',
  cover_image_url: '/images/luxury-apartment-township-sunset.webp',
  year: '2026',
  date: '10 Oct 2026',
};

// ====================================================================
// 2. RFC 5545 (.ics) CALENDAR INVITATION GENERATOR
// ====================================================================

export function generateIcsCalendar(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  visitDate: string; // e.g. "2026-10-15" or "15 Oct 2026"
  visitTime: string; // e.g. "11:00 AM" or "14:30"
  clientName: string;
  clientEmail?: string;
  organizerEmail?: string;
}): string {
  const organizerEmail = params.organizerEmail || 'notifications@sellmyghar.in';
  const clientEmail = params.clientEmail || 'client@sellmyghar.in';

  let startYear = 2026, startMonth = 10, startDay = 15;
  let startHour = 11, startMinute = 0;

  const dateStr = params.visitDate || '';
  const timeStr = params.visitTime || '';

  const ymdMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    startYear = parseInt(ymdMatch[1], 10);
    startMonth = parseInt(ymdMatch[2], 10);
    startDay = parseInt(ymdMatch[3], 10);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      startYear = parsed.getFullYear();
      startMonth = parsed.getMonth() + 1;
      startDay = parsed.getDate();
    }
  }

  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const meridian = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    startHour = h;
    startMinute = m;
  }

  // IST is UTC+05:30. Compute UTC equivalents
  const istEpoch = Date.UTC(startYear, startMonth - 1, startDay, startHour, startMinute, 0);
  const utcStartTime = new Date(istEpoch - (5 * 60 + 30) * 60 * 1000);
  const utcEndTime = new Date(utcStartTime.getTime() + 45 * 60 * 1000); // 45-min meeting duration

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(utcStartTime);
  const dtEnd = formatIcsDate(utcEndTime);

  const escapeIcs = (str: string) => {
    return (str || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SellMyGhar//Bengaluru Residential Resale Advisory//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Kolkata',
    'TZURL:http://tzurl.org/zoneinfo-outlook/Asia/Kolkata',
    'X-LIC-LOCATION:Asia/Kolkata',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0530',
    'TZOFFSETTO:+0530',
    'TZNAME:IST',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${params.uid}@sellmyghar.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(params.summary)}`,
    `DESCRIPTION:${escapeIcs(params.description)}`,
    `LOCATION:${escapeIcs(params.location)}`,
    `ORGANIZER;CN=SellMyGhar.in:mailto:${organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcs(params.clientName)}:mailto:${clientEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: SellMyGhar Property Site Visit',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}

export const DEFAULT_ONBOARDING_EMAIL_SUBJECT = 'Welcome to SellMyGhar.in - Bangalore\'s Verified Residential Resale Platform';

export const DEFAULT_ONBOARDING_EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SellMyGhar</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px 12px; color: #172033; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
    .header { background: #172033; padding: 24px 32px; text-align: left; border-bottom: 3px solid #244B8F; }
    .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #38BDF8; }
    .sub-brand { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8; margin-top: 4px; }
    .body { padding: 32px; }
    .badge-pill { display: inline-block; padding: 4px 12px; background: #EFF6FF; border: 1px solid #BFDBFE; color: #244B8F; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 800; color: #172033; margin: 0 0 16px 0; line-height: 1.3; }
    .feature-list { margin: 24px 0; padding: 0; list-style: none; }
    .feature-item { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .feature-icon { font-size: 18px; margin-right: 12px; line-height: 1.4; }
    .feature-title { font-weight: 700; color: #172033; font-size: 14px; margin-bottom: 2px; }
    .feature-desc { color: #64748B; font-size: 12px; line-height: 1.5; }
    .btn-wrap { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background: #244B8F; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 10px; box-shadow: 0 4px 12px rgba(36,75,143,0.3); }
    .footer { background: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; line-height: 1.5; }
    .footer a { color: #244B8F; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">SellMy<span>Ghar</span>.in</div>
      <div class="sub-brand">Bengaluru Residential Resale Advisory</div>
    </div>
    <div class="body">
      <div class="badge-pill">Welcome to SellMyGhar</div>
      <h1>Welcome to SellMyGhar, {{customer_name}}!</h1>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Thank you for joining SellMyGhar.in — Bengaluru's verified residential resale platform. Whether you are selling your high-rise apartment or searching for verified resale homes, our dedicated team is at your service.
      </p>
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">🛡️</div>
          <div>
            <div class="feature-title">100% Title-Vetted Resale Flats</div>
            <div class="feature-desc">BBMP A-Khata authentication and Form 15 Sub-Registrar 30-year continuous title diligence.</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🚫</div>
          <div>
            <div class="feature-title">Zero Broker Spam & Privacy First</div>
            <div class="feature-desc">Your contact details and flat identity remain protected under the DPDP Act 2023 until physical escorted viewing.</div>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🤝</div>
          <div>
            <div class="feature-title">Dedicated Relationship Desk</div>
            <div class="feature-desc">Assisted end-to-end showings, price negotiation, token escrow, and Sub-Registrar deed closing.</div>
          </div>
        </div>
      </div>
      <div class="btn-wrap">
        <a href="{{dashboard_url}}" class="btn" target="_blank">Access Your Dashboard &rarr;</a>
      </div>
      <p style="font-size: 13px; color: #64748B; text-align: center; margin: 24px 0 0 0;">
        Have questions or need assistance? Reply directly to this message or contact our onboarding team at <a href="mailto:onboarding@sellmyghar.in" style="color: #244B8F; font-weight: 700; text-decoration: none;">onboarding@sellmyghar.in</a>.
      </p>
    </div>
    <div class="footer">
      <p>This welcome notification was dispatched by SellMyGhar Onboarding (<strong>onboarding@sellmyghar.in</strong>).</p>
      <p>100% RERA compliant &bull; Form 15 EC Title Diligence &bull; Bengaluru, Karnataka</p>
      <p style="margin-top: 12px;">
        <a href="{{consent_url}}">Manage Communication Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ====================================================================
// 3. MAIN SERVICE CLASS
// ====================================================================

export class EmailNotificationService {
  /**
   * Mock provider hook for unit and integration testing
   */
  private static mockProvider: MockEmailProvider | null = null;

  public static setMockProvider(provider: MockEmailProvider | null): void {
    this.mockProvider = provider;
  }

  public static getMockProvider(): MockEmailProvider | null {
    return this.mockProvider;
  }

  /**
   * Initializes notification and template tables with complete schema columns
   */
  static async initTables(): Promise<void> {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS email_templates (
          template_key VARCHAR(64) PRIMARY KEY,
          subject_template TEXT NOT NULL,
          html_template TEXT NOT NULL,
          plain_text_template TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await executeQuery(`
        CREATE TABLE IF NOT EXISTS publication_notifications (
          id VARCHAR(64) PRIMARY KEY,
          property_id VARCHAR(64),
          recipient_email VARCHAR(255) NOT NULL,
          subject TEXT NOT NULL,
          html_body TEXT NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING_CONFIGURATION',
          idempotency_key VARCHAR(128) UNIQUE NOT NULL,
          provider_response TEXT,
          provider_message_id VARCHAR(128),
          event_type VARCHAR(64),
          error_message TEXT,
          delivery_attempts INT DEFAULT 1,
          sent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Ensure additional columns exist on pre-existing tables safely
      await executeQuery(`ALTER TABLE publication_notifications ADD COLUMN IF NOT EXISTS event_type VARCHAR(64);`);
      await executeQuery(`ALTER TABLE publication_notifications ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(128);`);
      await executeQuery(`ALTER TABLE publication_notifications ADD COLUMN IF NOT EXISTS error_message TEXT;`);
      await executeQuery(`ALTER TABLE publication_notifications ADD COLUMN IF NOT EXISTS delivery_attempts INT DEFAULT 1;`);
      await executeQuery(`ALTER TABLE publication_notifications ALTER COLUMN property_id DROP NOT NULL;`).catch(() => {});

      // Seed all 4 default templates if absent
      const seedTemplate = async (
        key: string,
        subject: string,
        html: string,
        plain: string
      ) => {
        const check = await executeQuery(`SELECT template_key FROM email_templates WHERE template_key = $1 LIMIT 1;`, [key]);
        if (!check.rows || check.rows.length === 0) {
          await executeQuery(`
            INSERT INTO email_templates (template_key, subject_template, html_template, plain_text_template, is_active, updated_at)
            VALUES ($1, $2, $3, $4, true, NOW())
            ON CONFLICT (template_key) DO NOTHING;
          `, [key, subject, html, plain]);
        }
      };

      await seedTemplate(
        'PROPERTY_PUBLISHED',
        DEFAULT_PUBLISHED_EMAIL_SUBJECT,
        DEFAULT_PUBLISHED_EMAIL_HTML,
        'A new verified listing has been published: {{property_title}} in {{locality}} for {{public_price}}.'
      );

      await seedTemplate(
        'PROPERTY_SUBMISSION_RECEIVED',
        DEFAULT_SUBMISSION_EMAIL_SUBJECT,
        DEFAULT_SUBMISSION_EMAIL_HTML,
        'Your property submission has been received. Reference: {{property_reference}}.'
      );

      await seedTemplate(
        'MEETING_SCHEDULED',
        DEFAULT_MEETING_EMAIL_SUBJECT,
        DEFAULT_MEETING_EMAIL_HTML,
        'Your meeting/site visit has been confirmed for {{property_title}} on {{meeting_date}} at {{meeting_time}} (IST).'
      );

      await seedTemplate(
        'PROPERTY_APPROVED',
        DEFAULT_APPROVED_EMAIL_SUBJECT,
        DEFAULT_APPROVED_EMAIL_HTML,
        'Your property {{property_title}} has been verified and approved on SellMyGhar.in.'
      );

      await seedTemplate(
        'USER_ONBOARDING_WELCOME',
        DEFAULT_ONBOARDING_EMAIL_SUBJECT,
        DEFAULT_ONBOARDING_EMAIL_HTML,
        'Welcome to SellMyGhar.in - Bangalore\'s Verified Residential Resale Platform.'
      );

      // Upgrade existing rows if present with outdated notification sender
      await executeQuery(`
        UPDATE email_templates 
        SET html_template = $1, subject_template = $2, updated_at = NOW() 
        WHERE template_key = 'USER_ONBOARDING_WELCOME' AND html_template LIKE '%notifications@sellmyghar.in%';
      `, [DEFAULT_ONBOARDING_EMAIL_HTML, DEFAULT_ONBOARDING_EMAIL_SUBJECT]).catch(() => {});
    } catch (err: any) {
      console.warn('[EmailNotificationService] initTables note:', err.message);
    }
  }

  /**
   * Inspects current email provider configuration status truthfully
   */
  static getProviderStatus(): {
    configured: boolean;
    provider: string;
    senderAddress: string;
    onboardingSenderAddress?: string;
    missingConfigs: string[];
    simulated: boolean;
    status: 'CONFIGURED' | 'SIMULATED';
    details: string;
    success: boolean;
  } {
    const resendApiKey = process.env.RESEND_API_KEY;
    const senderAddress = getFormattedSender('DEFAULT');
    const onboardingSenderAddress = getFormattedSender('ONBOARDING');

    const missing: string[] = [];
    if (!resendApiKey) {
      missing.push('RESEND_API_KEY');
    }

    const configured = missing.length === 0;
    const isMock = Boolean(this.mockProvider);

    let providerDesc = 'Resend Production Email API (https://api.resend.com)';
    let detailsDesc = 'Resend API authenticated. Dispatches production transactional emails via verified domain.';

    if (isMock) {
      providerDesc = 'Mocked Email Provider (Automated Test Mode)';
      detailsDesc = 'Mock email dispatcher active for automated unit and regression testing.';
    } else if (!configured) {
      providerDesc = 'Resend Sandbox Simulation Dispatcher (Awaiting RESEND_API_KEY)';
      detailsDesc = 'RESEND_API_KEY is not configured in environment variables. Email events are captured and logged to the CRM audit ledger.';
    }

    return {
      configured: configured || isMock,
      provider: providerDesc,
      senderAddress,
      onboardingSenderAddress,
      missingConfigs: missing,
      simulated: !configured && !isMock,
      status: (configured || isMock) ? 'CONFIGURED' : 'SIMULATED',
      details: detailsDesc,
      success: true,
    };
  }

  /**
   * Replaces template variables safely
   */
  static renderTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, value ?? '');
    }
    return result;
  }

  static interpolateTemplate(template: string, vars: Record<string, string>): string {
    return this.renderTemplate(template, vars);
  }

  /**
   * Fetch active template by key
   */
  static async getTemplate(key: string = 'PROPERTY_PUBLISHED'): Promise<EmailTemplateRecord> {
    await this.initTables();
    const res = await executeQuery<EmailTemplateRecord>(
      `SELECT * FROM email_templates WHERE template_key = $1 LIMIT 1;`,
      [key]
    );

    if (res.rows && res.rows.length > 0) {
      return res.rows[0];
    }

    // Default fallbacks in case database lookup returns empty
    switch (key) {
      case 'PROPERTY_SUBMISSION_RECEIVED':
        return {
          template_key: key,
          subject_template: DEFAULT_SUBMISSION_EMAIL_SUBJECT,
          html_template: DEFAULT_SUBMISSION_EMAIL_HTML,
          plain_text_template: 'Your property submission has been received. Reference: {{property_reference}}.',
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      case 'MEETING_SCHEDULED':
        return {
          template_key: key,
          subject_template: DEFAULT_MEETING_EMAIL_SUBJECT,
          html_template: DEFAULT_MEETING_EMAIL_HTML,
          plain_text_template: 'Your meeting has been scheduled for {{property_title}} on {{meeting_date}} at {{meeting_time}} (IST).',
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      case 'PROPERTY_APPROVED':
        return {
          template_key: key,
          subject_template: DEFAULT_APPROVED_EMAIL_SUBJECT,
          html_template: DEFAULT_APPROVED_EMAIL_HTML,
          plain_text_template: 'Your property {{property_title}} has been approved.',
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      case 'USER_ONBOARDING_WELCOME':
        return {
          template_key: key,
          subject_template: DEFAULT_ONBOARDING_EMAIL_SUBJECT,
          html_template: DEFAULT_ONBOARDING_EMAIL_HTML,
          plain_text_template: 'Welcome to SellMyGhar.in - Bangalore\'s Verified Residential Resale Platform.',
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      case 'PROPERTY_PUBLISHED':
      default:
        return {
          template_key: key,
          subject_template: DEFAULT_PUBLISHED_EMAIL_SUBJECT,
          html_template: DEFAULT_PUBLISHED_EMAIL_HTML,
          plain_text_template: 'A new verified listing has been published: {{property_title}} in {{locality}} for {{public_price}}.',
          is_active: true,
          updated_at: new Date().toISOString(),
        };
    }
  }

  /**
   * Save or update template
   */
  static async updateTemplate(
    key: string,
    payload: { subject_template: string; html_template: string; plain_text_template?: string }
  ): Promise<EmailTemplateRecord> {
    await this.initTables();
    if (!payload.subject_template || !payload.subject_template.trim()) {
      throw new Error('Subject template is required.');
    }
    if (!payload.html_template || !payload.html_template.trim()) {
      throw new Error('HTML body template is required.');
    }

    const plain = payload.plain_text_template || 'SellMyGhar notification update.';
    const res = await executeQuery<EmailTemplateRecord>(`
      INSERT INTO email_templates (template_key, subject_template, html_template, plain_text_template, is_active, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      ON CONFLICT (template_key) DO UPDATE
      SET subject_template = EXCLUDED.subject_template,
          html_template = EXCLUDED.html_template,
          plain_text_template = EXCLUDED.plain_text_template,
          updated_at = NOW()
      RETURNING *;
    `, [key, payload.subject_template.trim(), payload.html_template.trim(), plain]);

    return res.rows[0];
  }

  /**
   * Reset template to SellMyGhar default
   */
  static async resetTemplateToDefault(key: string = 'PROPERTY_PUBLISHED'): Promise<EmailTemplateRecord> {
    switch (key) {
      case 'PROPERTY_SUBMISSION_RECEIVED':
        return this.updateTemplate(key, {
          subject_template: DEFAULT_SUBMISSION_EMAIL_SUBJECT,
          html_template: DEFAULT_SUBMISSION_EMAIL_HTML,
          plain_text_template: 'Your property submission has been received. Reference: {{property_reference}}.',
        });
      case 'MEETING_SCHEDULED':
        return this.updateTemplate(key, {
          subject_template: DEFAULT_MEETING_EMAIL_SUBJECT,
          html_template: DEFAULT_MEETING_EMAIL_HTML,
          plain_text_template: 'Your meeting has been scheduled for {{property_title}} on {{meeting_date}} at {{meeting_time}} (IST).',
        });
      case 'PROPERTY_APPROVED':
        return this.updateTemplate(key, {
          subject_template: DEFAULT_APPROVED_EMAIL_SUBJECT,
          html_template: DEFAULT_APPROVED_EMAIL_HTML,
          plain_text_template: 'Your property {{property_title}} has been approved.',
        });
      case 'USER_ONBOARDING_WELCOME':
        return this.updateTemplate(key, {
          subject_template: DEFAULT_ONBOARDING_EMAIL_SUBJECT,
          html_template: DEFAULT_ONBOARDING_EMAIL_HTML,
          plain_text_template: 'Welcome to SellMyGhar.in - Bangalore\'s Verified Residential Resale Platform.',
        });
      case 'PROPERTY_PUBLISHED':
      default:
        return this.updateTemplate(key, {
          subject_template: DEFAULT_PUBLISHED_EMAIL_SUBJECT,
          html_template: DEFAULT_PUBLISHED_EMAIL_HTML,
          plain_text_template: 'A new verified listing has been published: {{property_title}} in {{locality}} for {{public_price}}.',
        });
    }
  }

  static async handleBrochureShared(args: {
    recipient: string;
    subject: string;
    html: string;
    propertyId: string;
    actor?: AuthenticatedUser;
  }): Promise<{
    dispatched: boolean;
    notificationId: string;
    status: PublicationNotificationRecord['status'];
    providerMessageId?: string | null;
    reason?: string;
    error?: string;
  }> {
    const idempotencyKey = `brochure-share-${args.propertyId}-${args.recipient.toLowerCase().trim()}-${Date.now()}`;
    return this.dispatchEmail({
      recipient: args.recipient,
      subject: args.subject,
      html: args.html,
      eventType: 'PROPERTY_PUBLISHED',
      idempotencyKey,
      propertyId: args.propertyId,
      actor: args.actor,
    });
  }

  /**
   * Internal Core Dispatcher:
   * - Strict Idempotency check: exactly one email per event
   * - Resend API HTTP dispatcher with timeout
   * - Mock provider delegation for tests
   * - Honest failure tracking (does not mark as delivered on failure)
   * - Audit logging
   */
  private static async dispatchEmail(args: {
    recipient: string;
    subject: string;
    html: string;
    eventType: 'PROPERTY_LISTED' | 'MEETING_SCHEDULED' | 'PROPERTY_APPROVED' | 'PROPERTY_PUBLISHED' | 'USER_WELCOME' | 'INTERNAL_PROPERTY_INTAKE' | 'TEST';
    idempotencyKey: string;
    propertyId?: string | null;
    attachments?: EmailAttachment[];
    actor?: AuthenticatedUser;
    fromAddress?: string;
  }): Promise<{
    dispatched: boolean;
    notificationId: string;
    status: PublicationNotificationRecord['status'];
    providerMessageId?: string | null;
    reason?: string;
    error?: string;
  }> {
    await this.initTables();

    const { recipient, subject, html, eventType, idempotencyKey, propertyId, attachments, actor } = args;

    // 1. Idempotency Check: prevent duplicate dispatch
    const existingRes = await executeQuery<PublicationNotificationRecord>(
      `SELECT * FROM publication_notifications WHERE idempotency_key = $1 LIMIT 1;`,
      [idempotencyKey]
    );

    if (existingRes.rows && existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      if (existing.status === 'DELIVERED' || existing.status === 'SIMULATED') {
        console.info(`[EmailNotificationService] Email already dispatched (Idempotency Key: ${idempotencyKey}, Notification ID: ${existing.id})`);
        return {
          dispatched: false,
          notificationId: existing.id,
          status: existing.status,
          providerMessageId: existing.provider_message_id,
          reason: 'ALREADY_DISPATCHED',
        };
      }
      // If previously FAILED, allow retry and increment attempts
    }

    const notifId = existingRes.rows && existingRes.rows.length > 0
      ? existingRes.rows[0].id
      : `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const currentAttempts = (existingRes.rows && existingRes.rows.length > 0 ? (existingRes.rows[0].delivery_attempts || 1) : 0) + 1;

    const fromAddress = args.fromAddress || getFormattedSender('DEFAULT');
    const apiKey = process.env.RESEND_API_KEY;

    let finalStatus: PublicationNotificationRecord['status'] = 'SIMULATED';
    let providerMsgId: string | null = null;
    let providerResponse: string = '';
    let errorMessage: string | null = null;
    let dispatchedSuccessfully = false;

    // 2. Mock Provider Dispatch (if hooked)
    if (this.mockProvider) {
      try {
        const mockResult = await this.mockProvider({
          to: recipient,
          from: fromAddress,
          subject,
          html,
          attachments,
          eventType,
        });

        if (mockResult.success) {
          finalStatus = 'DELIVERED';
          providerMsgId = mockResult.messageId || `mock-msg-${Date.now()}`;
          providerResponse = JSON.stringify({ id: providerMsgId, mocked: true, status: 'success' });
          dispatchedSuccessfully = true;
        } else {
          finalStatus = 'FAILED';
          errorMessage = mockResult.error || 'Mock provider rejected dispatch';
          providerResponse = JSON.stringify({ error: errorMessage, mocked: true });
        }
      } catch (mockErr: any) {
        finalStatus = 'FAILED';
        errorMessage = mockErr.message || 'Mock provider exception';
        providerResponse = JSON.stringify({ error: errorMessage });
      }
    }
    // 3. Resend Production REST API Dispatch
    else if (apiKey) {
      try {
        const payload: Record<string, any> = {
          from: fromAddress,
          to: [recipient],
          subject,
          html,
        };

        if (attachments && attachments.length > 0) {
          payload.attachments = attachments.map(att => ({
            filename: att.filename,
            content: att.content,
            content_type: att.contentType,
          }));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const responseText = await resendRes.text();
        let parsedJson: any = null;
        try {
          parsedJson = JSON.parse(responseText);
        } catch {}

        if (resendRes.ok && parsedJson && parsedJson.id) {
          finalStatus = 'DELIVERED';
          providerMsgId = parsedJson.id;
          providerResponse = responseText;
          dispatchedSuccessfully = true;
          console.info(`[EmailNotificationService] Dispatched via Resend: ID ${providerMsgId} to ${recipient}`);
        } else if ((resendRes.status === 403 || resendRes.status === 422) && fromAddress !== 'onboarding@resend.dev') {
          console.warn(`[EmailNotificationService] Resend rejection (${resendRes.status}): ${parsedJson?.message || responseText}. Retrying with test sandbox sender onboarding@resend.dev...`);
          try {
            payload.from = 'SellMyGhar <onboarding@resend.dev>';
            const retryRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });
            const retryText = await retryRes.text();
            let retryJson: any = null;
            try { retryJson = JSON.parse(retryText); } catch {}
            if (retryRes.ok && retryJson && retryJson.id) {
              finalStatus = 'DELIVERED';
              providerMsgId = retryJson.id;
              providerResponse = retryText;
              dispatchedSuccessfully = true;
              console.info(`[EmailNotificationService] Dispatched via Resend Sandbox: ID ${providerMsgId} to ${recipient}`);
            } else {
              finalStatus = 'FAILED';
              errorMessage = retryJson?.message || parsedJson?.message || `HTTP ${resendRes.status}: ${resendRes.statusText}`;
              providerResponse = retryText;
            }
          } catch (retryErr: any) {
            finalStatus = 'FAILED';
            errorMessage = retryErr.message;
            providerResponse = responseText;
          }
        } else {
          finalStatus = 'FAILED';
          errorMessage = parsedJson?.message || `HTTP ${resendRes.status}: ${resendRes.statusText}`;
          providerResponse = responseText;
          console.error(`[EmailNotificationService] Resend API rejection (${resendRes.status}): ${errorMessage}`);
        }
      } catch (apiErr: any) {
        finalStatus = 'FAILED';
        errorMessage = apiErr.name === 'AbortError' ? 'Resend request timeout (10s)' : (apiErr.message || 'Network error');
        providerResponse = JSON.stringify({ error: errorMessage });
        console.error(`[EmailNotificationService] Resend dispatch exception:`, errorMessage);
      }
    }
    // 4. Simulated Fallback (when RESEND_API_KEY is not configured)
    else {
      finalStatus = 'SIMULATED';
      providerResponse = 'Simulated dispatch: RESEND_API_KEY not configured in environment. Logged to CRM audit ledger.';
      dispatchedSuccessfully = true;
      console.info(`[EmailNotificationService] Simulated email to ${recipient} (${eventType})`);
    }

    // 5. Persist to PostgreSQL publication_notifications
    const sentAt = (finalStatus === 'DELIVERED' || finalStatus === 'SIMULATED') ? new Date().toISOString() : null;

    if (existingRes.rows && existingRes.rows.length > 0) {
      await executeQuery(`
        UPDATE publication_notifications
        SET recipient_email = $1,
            subject = $2,
            html_body = $3,
            status = $4,
            provider_response = $5,
            provider_message_id = $6,
            error_message = $7,
            delivery_attempts = $8,
            sent_at = $9,
            updated_at = NOW()
        WHERE id = $10;
      `, [
        recipient,
        subject,
        html,
        finalStatus,
        providerResponse,
        providerMsgId,
        errorMessage,
        currentAttempts,
        sentAt,
        notifId
      ]);
    } else {
      await executeQuery(`
        INSERT INTO publication_notifications 
          (id, property_id, recipient_email, subject, html_body, status, idempotency_key, event_type, provider_response, provider_message_id, error_message, delivery_attempts, sent_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        ON CONFLICT (idempotency_key) DO UPDATE
        SET status = EXCLUDED.status,
            provider_response = EXCLUDED.provider_response,
            provider_message_id = EXCLUDED.provider_message_id,
            error_message = EXCLUDED.error_message,
            delivery_attempts = publication_notifications.delivery_attempts + 1,
            sent_at = EXCLUDED.sent_at,
            updated_at = NOW();
      `, [
        notifId,
        propertyId || null,
        recipient,
        subject,
        html,
        finalStatus,
        idempotencyKey,
        eventType,
        providerResponse,
        providerMsgId,
        errorMessage,
        currentAttempts,
        sentAt
      ]);
    }

    // 6. Record Audit Log
    if (actor) {
      await recordAuditEvent({
        actor,
        action: (eventType === 'PROPERTY_PUBLISHED' ? 'PROPERTY_PUBLISHED' : (eventType === 'MEETING_SCHEDULED' ? 'VISIT_SCHEDULED' : (eventType === 'PROPERTY_LISTED' ? 'PROPERTY_CREATED' : 'PROPERTY_UPDATED'))) as any,
        targetEntity: 'notifications',
        targetEntityId: notifId,
        clientIp: '127.0.0.1',
        diffSummary: {
          recipient,
          eventType,
          status: finalStatus,
          providerMessageId: providerMsgId,
          attempts: currentAttempts,
          idempotencyKey,
        },
      });
    }

    return {
      dispatched: dispatchedSuccessfully,
      notificationId: notifId,
      status: finalStatus,
      providerMessageId: providerMsgId,
      error: errorMessage || undefined,
    };
  }

  // ====================================================================
  // 4. WORKFLOW 1: PROPERTY LISTED (Seller Submission Confirmation)
  // ====================================================================

  static async handlePropertyListed(
    propertyData: {
      id: string;
      referenceId?: string;
      ownerName: string;
      ownerEmail?: string | null;
      ownerPhone?: string;
      propertyType?: string;
      propertyLocation?: string;
      locality?: string;
      listingType?: string;
      askingPrice?: number;
    },
    actor?: AuthenticatedUser
  ): Promise<{ dispatched: boolean; notificationId?: string; status: string; reason?: string }> {
    await this.initTables();

    const propId = String(propertyData.id);
    const idempotencyKey = `listed-${propId}`;

    const refId = propertyData.referenceId || `SMG-${new Date().getFullYear()}-${propId.slice(-4)}`;
    const recipient = (propertyData.ownerEmail && propertyData.ownerEmail.includes('@'))
      ? propertyData.ownerEmail.trim()
      : (process.env.OPERATIONS_EMAIL || 'notifications@sellmyghar.in');

    const baseUrl = process.env.APP_BASE_URL || 'https://sellmyghar.in';
    const vars: Record<string, string> = {
      customer_name: propertyData.ownerName || 'Property Owner',
      owner_name: propertyData.ownerName || 'Property Owner',
      property_reference: refId,
      property_type: propertyData.propertyType || '3 BHK Flat / Apartment',
      property_location: propertyData.propertyLocation || propertyData.locality || 'Bengaluru',
      listing_type: propertyData.listingType || 'Assisted Resale (Verified)',
      dashboard_url: `${baseUrl}/#/dashboard`,
      year: new Date().getFullYear().toString(),
    };

    const template = await this.getTemplate('PROPERTY_SUBMISSION_RECEIVED');
    const subject = this.renderTemplate(template.subject_template, vars);
    const html = this.renderTemplate(template.html_template, vars);

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'PROPERTY_LISTED',
      idempotencyKey,
      propertyId: propId,
      actor,
    });
  }

  // ====================================================================
  // 4B. WORKFLOW: CUSTOMER ONBOARDING WELCOME
  // ====================================================================

  static async handleUserOnboarding(
    userData: {
      userId?: string;
      name?: string;
      email: string;
      phone?: string;
      role?: string;
    },
    actor?: AuthenticatedUser
  ): Promise<{ dispatched: boolean; notificationId?: string; status: string; reason?: string }> {
    await this.initTables();

    const recipient = (userData.email || '').trim();
    if (!recipient || !recipient.includes('@')) {
      return { dispatched: false, status: 'SKIPPED', reason: 'NO_VALID_EMAIL' };
    }

    const cleanUserId = String(userData.userId || 'anon');
    const idempotencyKey = `welcome-${cleanUserId}-${recipient.toLowerCase()}`;

    const baseUrl = process.env.APP_BASE_URL || 'https://sellmyghar.in';
    const vars: Record<string, string> = {
      customer_name: userData.name || 'Homeowner',
      dashboard_url: `${baseUrl}/#/dashboard`,
      consent_url: `${baseUrl}/#/consent`,
      year: new Date().getFullYear().toString(),
    };

    const template = await this.getTemplate('USER_ONBOARDING_WELCOME');
    const subject = this.renderTemplate(template.subject_template, vars);
    const html = this.renderTemplate(template.html_template, vars);
    const onboardingSender = process.env.RESEND_ONBOARDING_FROM_EMAIL || 'SellMyGhar Onboarding <onboarding@sellmyghar.in>';

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'USER_WELCOME',
      idempotencyKey,
      propertyId: null,
      actor,
      fromAddress: onboardingSender,
    });
  }

  // ====================================================================
  // 5. WORKFLOW 2: MEETING SCHEDULED (Site Visit with .ics Invitation)
  // ====================================================================

  static async handleMeetingScheduled(
    meetingData: {
      visitId: string;
      propertyId: string;
      leadId?: string | null;
      clientName: string;
      clientPhone: string;
      clientEmail?: string | null;
      visitDate: string;
      visitTime: string;
      staffId?: string;
      notes?: string;
      propertyTitle?: string;
      propertyLocation?: string;
    },
    actor?: AuthenticatedUser
  ): Promise<{ dispatched: boolean; notificationId?: string; status: string; reason?: string }> {
    await this.initTables();

    const visitId = String(meetingData.visitId);
    const idempotencyKey = `meeting-${visitId}`;

    let title = meetingData.propertyTitle;
    let location = meetingData.propertyLocation;

    if (!title || !location) {
      try {
        const pRes = await executeQuery(`SELECT title, project_locality_id, bhk_type FROM properties WHERE id = $1 LIMIT 1;`, [meetingData.propertyId]);
        if (pRes.rows && pRes.rows.length > 0) {
          const row = pRes.rows[0];
          title = title || row.title || `${row.bhk_type || '2BHK'} Residence in ${row.project_locality_id || 'Bengaluru'}`;
          location = location || row.project_locality_id || 'Bengaluru';
        }
      } catch {}
    }

    title = title || 'SellMyGhar Verified Property Site Visit';
    location = location || 'Bengaluru';

    const recipient = (meetingData.clientEmail && meetingData.clientEmail.includes('@'))
      ? meetingData.clientEmail.trim()
      : (process.env.OPERATIONS_EMAIL || 'notifications@sellmyghar.in');

    const baseUrl = process.env.APP_BASE_URL || 'https://sellmyghar.in';
    const specialistName = 'Rajesh Kumar (Senior Resale Specialist)';

    const vars: Record<string, string> = {
      client_name: meetingData.clientName || 'Valued Customer',
      customer_name: meetingData.clientName || 'Valued Customer',
      property_title: title,
      meeting_date: meetingData.visitDate,
      meeting_time: meetingData.visitTime,
      meeting_timezone: 'Asia/Kolkata (IST, UTC+05:30)',
      meeting_location: location,
      specialist_name: specialistName,
      dashboard_url: `${baseUrl}/#/dashboard`,
      year: new Date().getFullYear().toString(),
    };

    const template = await this.getTemplate('MEETING_SCHEDULED');
    const subject = this.renderTemplate(template.subject_template, vars);
    const html = this.renderTemplate(template.html_template, vars);

    // Generate valid RFC 5545 .ics Calendar Invitation
    const icsContent = generateIcsCalendar({
      uid: visitId,
      summary: `Site Visit: ${title}`,
      description: `SellMyGhar Assisted Site Walkthrough & Diligence Consultation.\nClient: ${meetingData.clientName} (${meetingData.clientPhone})\nSpecialist: ${specialistName}\nNotes: ${meetingData.notes || 'None'}`,
      location,
      visitDate: meetingData.visitDate,
      visitTime: meetingData.visitTime,
      clientName: meetingData.clientName,
      clientEmail: meetingData.clientEmail || undefined,
    });

    const icsBase64 = Buffer.from(icsContent, 'utf-8').toString('base64');
    const attachments: EmailAttachment[] = [
      {
        filename: 'sellmyghar-site-visit.ics',
        content: icsBase64,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ];

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'MEETING_SCHEDULED',
      idempotencyKey,
      propertyId: meetingData.propertyId,
      attachments,
      actor,
    });
  }

  // ====================================================================
  // 6. WORKFLOW 3: PROPERTY APPROVED (Legal Diligence Completed)
  // ====================================================================

  static async resolveOwnerDetails(property: any): Promise<{ email: string; name: string }> {
    let ownerEmail = property.owner_email || property.ownerEmail || property.email;
    let ownerName = property.owner_name || property.ownerName;

    // 1. Inspect internal_verification_notes directly on property object
    if (property.internal_verification_notes) {
      try {
        const notes = typeof property.internal_verification_notes === 'string'
          ? JSON.parse(property.internal_verification_notes)
          : property.internal_verification_notes;
        if (!ownerEmail) ownerEmail = notes.ownerEmail || notes.sellerEmail || notes.email;
        if (!ownerName) ownerName = notes.ownerName || notes.name;
      } catch {}
    }

    // 2. Query properties table if notes or owner_id were missing from passed object
    if ((!ownerEmail || !ownerName) && property.id) {
      try {
        const pDb = await executeQuery(`SELECT internal_verification_notes, owner_id FROM properties WHERE id = $1 LIMIT 1;`, [property.id]);
        if (pDb.rows && pDb.rows.length > 0) {
          const row = pDb.rows[0];
          if (row.internal_verification_notes) {
            try {
              const notes = typeof row.internal_verification_notes === 'string'
                ? JSON.parse(row.internal_verification_notes)
                : row.internal_verification_notes;
              if (!ownerEmail) ownerEmail = notes.ownerEmail || notes.sellerEmail || notes.email;
              if (!ownerName) ownerName = notes.ownerName || notes.name;
            } catch {}
          }
          if (!property.owner_id && row.owner_id) {
            property.owner_id = row.owner_id;
          }
        }
      } catch {}
    }

    // 3. Query users table by owner_id
    if (property.owner_id && (!ownerEmail || !ownerName)) {
      try {
        const uRes = await executeQuery(`SELECT email, display_name FROM users WHERE id = $1 LIMIT 1;`, [property.owner_id]);
        if (uRes.rows && uRes.rows[0]) {
          if (!ownerEmail && uRes.rows[0].email) ownerEmail = uRes.rows[0].email;
          if (!ownerName && uRes.rows[0].display_name) ownerName = uRes.rows[0].display_name;
        }
      } catch {}
    }

    // 4. Query seller_leads table by property_id
    if (property.id && (!ownerEmail || !ownerName)) {
      try {
        const leadRes = await executeQuery(`SELECT email, owner_name FROM seller_leads WHERE property_id = $1 LIMIT 1;`, [property.id]);
        if (leadRes.rows && leadRes.rows[0]) {
          if (!ownerEmail && leadRes.rows[0].email) ownerEmail = leadRes.rows[0].email;
          if (!ownerName && leadRes.rows[0].owner_name) ownerName = leadRes.rows[0].owner_name;
        }
      } catch {}
    }

    // 5. Query seller_leads and users by owner_phone if available
    const phone = property.owner_phone || property.phone;
    if (phone && (!ownerEmail || !ownerName)) {
      try {
        const leadPhoneRes = await executeQuery(`SELECT email, owner_name FROM seller_leads WHERE phone = $1 LIMIT 1;`, [phone]);
        if (leadPhoneRes.rows && leadPhoneRes.rows[0]) {
          if (!ownerEmail && leadPhoneRes.rows[0].email) ownerEmail = leadPhoneRes.rows[0].email;
          if (!ownerName && leadPhoneRes.rows[0].owner_name) ownerName = leadPhoneRes.rows[0].owner_name;
        }
      } catch {}
      if (!ownerEmail) {
        try {
          const userPhoneRes = await executeQuery(`SELECT email, display_name FROM users WHERE phone = $1 LIMIT 1;`, [phone]);
          if (userPhoneRes.rows && userPhoneRes.rows[0]) {
            if (!ownerEmail && userPhoneRes.rows[0].email) ownerEmail = userPhoneRes.rows[0].email;
            if (!ownerName && userPhoneRes.rows[0].display_name) ownerName = userPhoneRes.rows[0].display_name;
          }
        } catch {}
      }
    }

    const resolvedEmail = (ownerEmail && typeof ownerEmail === 'string' && ownerEmail.includes('@'))
      ? ownerEmail.trim()
      : (process.env.OPERATIONS_EMAIL || 'notifications@sellmyghar.in');

    const resolvedName = (ownerName && typeof ownerName === 'string' && ownerName.trim())
      ? ownerName.trim()
      : 'Property Owner';

    return { email: resolvedEmail, name: resolvedName };
  }

  static async handlePropertyApproved(
    property: any,
    actor?: AuthenticatedUser
  ): Promise<{ dispatched: boolean; notificationId?: string; status: string; reason?: string }> {
    await this.initTables();

    const propId = String(property.id);
    const idempotencyKey = `approved-${propId}`;

    const { email: recipient, name: resolvedOwnerName } = await this.resolveOwnerDetails(property);

    const title = property.title || `${property.bhk_type || '2BHK'} Apartment in ${property.project_name || property.project_locality_id || 'Bengaluru'}`;
    const locality = property.locality_name || property.locality || property.project_locality_id || 'Bengaluru';
    const bhk = property.bhk_type || '3BHK';
    const pType = property.property_type || 'Apartment';
    const area = `${property.super_built_up_sqft || 1500} sq.ft`;
    const priceNum = Number(property.asking_price_inr || 0);
    const publicPrice = priceNum >= 10000000 
      ? `₹${(priceNum / 10000000).toFixed(2)} Cr`
      : `₹${(priceNum / 100000).toFixed(2)} Lakh`;

    const baseUrl = process.env.APP_BASE_URL || 'https://sellmyghar.in';
    const refId = property.reference_id || property.referenceId || `SMG-${propId.slice(-4)}`;

    const vars: Record<string, string> = {
      customer_name: resolvedOwnerName,
      owner_name: resolvedOwnerName,
      property_title: title,
      property_reference: refId,
      locality,
      property_type: pType,
      bhk,
      area,
      public_price: publicPrice,
      verification_tier: property.verification_tier || 'LEVEL_2_DOCS_REVIEWED',
      dashboard_url: `${baseUrl}/#/dashboard`,
      year: new Date().getFullYear().toString(),
    };

    const template = await this.getTemplate('PROPERTY_APPROVED');
    const subject = this.renderTemplate(template.subject_template, vars);
    const html = this.renderTemplate(template.html_template, vars);

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'PROPERTY_APPROVED',
      idempotencyKey,
      propertyId: propId,
      actor,
    });
  }

  // ====================================================================
  // 7. WORKFLOW 4: PROPERTY PUBLISHED (Live Public Listing)
  // ====================================================================

  static async handlePropertyPublished(
    property: any,
    images: any[] = [],
    actor?: AuthenticatedUser
  ): Promise<{ dispatched: boolean; notificationId?: string; status: string; reason?: string }> {
    await this.initTables();

    const propId = String(property.id);
    const idempotencyKey = `pub-${propId}-v1`;

    const { email: recipient, name: resolvedOwnerName } = await this.resolveOwnerDetails(property);

    const title = property.title || `${property.bhk_type || '2BHK'} Apartment in ${property.project_name || property.project_locality_id || 'Bengaluru'}`;
    const locality = property.locality_name || property.locality || property.project_locality_id || 'Bengaluru';
    const bhk = property.bhk_type || '2BHK';
    const pType = property.property_type || 'Apartment';
    const area = `${property.super_built_up_sqft || 1200} sq.ft`;
    const priceNum = Number(property.asking_price_inr || 0);
    const publicPrice = priceNum >= 10000000 
      ? `₹${(priceNum / 10000000).toFixed(2)} Cr`
      : `₹${(priceNum / 100000).toFixed(2)} Lakh`;
    
    const primaryImg = images.find(i => i.is_featured)?.url || images[0]?.url || getDistinctCommunityPhoto(propId || title || locality, 800);
    const baseUrl = process.env.APP_BASE_URL || 'https://sellmyghar.in';
    const propertyUrl = `${baseUrl}/#/property/${propId}`;

    const vars: Record<string, string> = {
      customer_name: resolvedOwnerName,
      owner_name: resolvedOwnerName,
      property_title: title,
      locality,
      property_type: pType,
      bhk,
      area,
      public_price: publicPrice,
      property_url: propertyUrl,
      cover_image_url: primaryImg,
      year: new Date().getFullYear().toString(),
    };

    const template = await this.getTemplate('PROPERTY_PUBLISHED');
    const subject = this.renderTemplate(template.subject_template, vars);
    const html = this.renderTemplate(template.html_template, vars);

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'PROPERTY_PUBLISHED',
      idempotencyKey,
      propertyId: propId,
      actor,
    });
  }

  // ====================================================================
  // 7b. INTERNAL STAFF PROPERTY INTAKE NOTIFICATION
  // ====================================================================

  static async handleInternalStaffPropertyIntakeNotification(data: {
    id: string;
    referenceId: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string | null;
    societyName: string;
    locality: string;
    bhkType: string;
    propertyType: string;
    priceOrRent: number;
    intent: string;
    facing?: string;
    areaSqft?: number;
    propertyAge?: string;
    expectedPossessionDate?: string | null;
    createdAt?: string;
  }): Promise<{ dispatched: boolean; status: string; error?: string }> {
    const recipient = process.env.INTERNAL_ALERT_EMAIL || 'sellmyghar1@gmail.com';
    const idempotencyKey = `internal-intake-${data.id}`;

    const baseUrl = process.env.APP_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
    const crmUrl = `${baseUrl}/#/crm?section=PROPERTIES&id=${data.id}`;

    const formattedPrice = data.priceOrRent >= 10000000
      ? `₹${(data.priceOrRent / 10000000).toFixed(2)} Crore`
      : data.priceOrRent >= 100000
      ? `₹${(data.priceOrRent / 100000).toFixed(2)} Lakhs`
      : `₹${data.priceOrRent.toLocaleString('en-IN')}`;

    const subject = `[SellMyGhar Internal Alert] New Property Listed: ${data.referenceId} - ${data.societyName}, ${data.locality}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Property Submission Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px; color: #172033; }
    .card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #244B8F; padding-bottom: 16px; margin-bottom: 24px; }
    .title { color: #244B8F; font-size: 20px; font-weight: 800; margin: 0; }
    .ref-badge { display: inline-block; background-color: #EFF6FF; color: #244B8F; font-family: monospace; font-size: 14px; font-weight: 700; padding: 4px 12px; border-radius: 6px; margin-top: 8px; }
    .grid { margin-top: 20px; width: 100%; border-collapse: collapse; }
    .grid td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
    .label { font-weight: 600; color: #64748B; width: 38%; }
    .value { font-weight: 700; color: #172033; }
    .btn { display: inline-block; background-color: #244B8F; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin-top: 24px; }
    .footer { margin-top: 24px; font-size: 12px; color: #94A3B8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 class="title">New Property Intake Alert</h2>
      <div class="ref-badge">Tracking ID: ${data.referenceId}</div>
    </div>
    <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
      A new residential property has just been submitted via the owner onboarding wizard and registered in the operations database.
    </p>
    <table class="grid">
      <tr>
        <td class="label">Apartment / Society</td>
        <td class="value">${data.societyName}</td>
      </tr>
      <tr>
        <td class="label">Bengaluru Locality</td>
        <td class="value">${data.locality}</td>
      </tr>
      <tr>
        <td class="label">Configuration</td>
        <td class="value">${data.bhkType} (${data.propertyType})</td>
      </tr>
      <tr>
        <td class="label">Built-up Area</td>
        <td class="value">${data.areaSqft ? `${data.areaSqft} sq.ft` : 'Declared'}</td>
      </tr>
      <tr>
        <td class="label">Facing Direction</td>
        <td class="value">${data.facing || 'East'}</td>
      </tr>
      <tr>
        <td class="label">Expected Price / Rent</td>
        <td class="value" style="color: #244B8F; font-size: 16px;">${formattedPrice} (${data.intent})</td>
      </tr>
      <tr>
        <td class="label">Property Age</td>
        <td class="value">${data.propertyAge || 'Declared'}</td>
      </tr>
      ${data.expectedPossessionDate ? `
      <tr>
        <td class="label">Expected Possession</td>
        <td class="value" style="color: #D97706;">${data.expectedPossessionDate}</td>
      </tr>` : ''}
      <tr>
        <td class="label">Owner Name</td>
        <td class="value">${data.ownerName}</td>
      </tr>
      <tr>
        <td class="label">Owner Phone</td>
        <td class="value">${data.ownerPhone}</td>
      </tr>
      <tr>
        <td class="label">Owner Email</td>
        <td class="value">${data.ownerEmail || 'Not provided'}</td>
      </tr>
      <tr>
        <td class="label">Submission Time</td>
        <td class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
      </tr>
    </table>
    <div style="text-align: center;">
      <a href="${crmUrl}" class="btn" target="_blank" rel="noopener">Open in CRM Operations Desk &rarr;</a>
    </div>
    <div class="footer">
      Automated internal dispatch for SellMyGhar Operations & Title Diligence Desk.
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.dispatchEmail({
      recipient,
      subject,
      html,
      eventType: 'INTERNAL_PROPERTY_INTAKE',
      idempotencyKey,
      propertyId: data.id,
      fromAddress: process.env.RESEND_FROM_EMAIL || 'SellMyGhar System <notifications@sellmyghar.in>',
    });
  }

  // ====================================================================
  // 7b. TRANSACTIONAL PASSWORD RESET EMAIL DISPATCH
  // ====================================================================

  static async sendPasswordResetEmail(args: {
    recipientEmail: string;
    resetUrl: string;
    expiresInMinutes?: number;
  }): Promise<{ success: boolean; status: string }> {
    const html = `
      <div style="font-family: 'Poppins', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #244B8F; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          We received a request to reset your SellMyGhar portal password. Click the secure button below to set a new password. This link is single-use and will expire in ${args.expiresInMinutes || 15} minutes.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${args.resetUrl}" style="background: #244B8F; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="font-size: 12px; color: #94A3B8; line-height: 1.5;">
          If you did not initiate this request, you can safely disregard this message. Your account credentials remain secure.
        </p>
        <hr style="border: 0; border-top: 1px solid #EDF2F7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94A3B8; text-align: center;">
          SellMyGhar.in &bull; ${EMAIL_SENDER_CONFIG.legalOffice}
        </p>
      </div>
    `.trim();

    const dispatchRes = await this.dispatchEmail({
      recipient: args.recipientEmail,
      subject: 'Reset Your SellMyGhar Password',
      html,
      eventType: 'TEST',
      idempotencyKey: `pw-reset-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      propertyId: null,
      fromAddress: getFormattedSender('SUPPORT'),
    });

    return { success: dispatchRes.dispatched, status: dispatchRes.status };
  }

  // ====================================================================
  // 8. TEST DISPATCH & NOTIFICATION LISTING
  // ====================================================================

  static async sendTestEmail(
    targetEmail: string,
    subjectTemplate?: string,
    htmlTemplate?: string,
    templateKey: string = 'PROPERTY_PUBLISHED'
  ): Promise<{ success: boolean; message: string; status: string; notificationId?: string }> {
    if (!targetEmail || !targetEmail.includes('@')) {
      throw new Error('Valid target recipient email address is required.');
    }

    const template = await this.getTemplate(templateKey);
    const subjTpl = subjectTemplate || template.subject_template;
    const bodyTpl = htmlTemplate || template.html_template;

    const sampleVars = { ...DEFAULT_EMAIL_SAMPLE_VARS };
    const subject = this.renderTemplate(subjTpl, sampleVars);
    const html = this.renderTemplate(bodyTpl, sampleVars);

    const idempotencyKey = `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fromAddress = templateKey === 'USER_ONBOARDING_WELCOME'
      ? getFormattedSender('ONBOARDING')
      : getFormattedSender('DEFAULT');

    const dispatchRes = await this.dispatchEmail({
      recipient: targetEmail,
      subject,
      html,
      eventType: 'TEST',
      idempotencyKey,
      propertyId: 'sample-test-prop',
      fromAddress,
    });

    const isSimulated = dispatchRes.status === 'SIMULATED';
    const message = isSimulated
      ? `Test email simulated for ${targetEmail}. (RESEND_API_KEY not configured, recorded in CRM audit ledger).`
      : dispatchRes.dispatched
      ? `Test email successfully dispatched to ${targetEmail} via Resend.`
      : `Resend dispatch failed: ${dispatchRes.error || 'Provider rejected request'}`;


    return {
      success: dispatchRes.dispatched,
      status: dispatchRes.status,
      message,
      notificationId: dispatchRes.notificationId,
    };
  }

  static async listNotifications(limit: number = 50): Promise<PublicationNotificationRecord[]> {
    await this.initTables();
    const res = await executeQuery<PublicationNotificationRecord>(
      `SELECT * FROM publication_notifications ORDER BY created_at DESC LIMIT $1;`,
      [limit]
    );
    return res.rows || [];
  }
}
