import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Eye, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Code,
  Info,
  Smartphone,
  Monitor,
  Maximize2,
  Copy,
  Check,
  Sparkles,
  FileText,
  Calendar,
  BadgeCheck
} from 'lucide-react';

export interface EmailTemplateData {
  id?: string;
  template_key?: string;
  template_type?: string;
  subject: string;
  html_body: string;
  subject_template?: string;
  html_template?: string;
  is_active: boolean;
  updated_at?: string;
}

export interface EmailProviderStatus {
  provider: string;
  configured: boolean;
  status: 'CONFIGURED' | 'SIMULATED';
  details: string;
}

export const USER_SUBMISSION_TEMPLATE_DEFAULT = `<!doctype html>
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

export const PUBLISHED_TEMPLATE_DEFAULT = `<!DOCTYPE html>
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
      <p>100% RERA compliant &bull; Kaveri 2.0 EC Diligence &bull; Bengaluru, Karnataka</p>
      <p style="margin-top: 12px;">
        <a href="https://sellmyghar.in/#/consent">Manage Communication Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;

export const MEETING_TEMPLATE_DEFAULT = `<!DOCTYPE html>
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

export const APPROVED_TEMPLATE_DEFAULT = `<!DOCTYPE html>
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
        <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Kaveri 2.0 EC Diligence &bull; Level 2 Document Verification Passed</div>
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

export const DEFAULT_SAMPLE_VARS: Record<string, string> = {
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
  bhk: '3 BHK',
  area: '1,650 sq.ft',
  listing_type: 'Assisted Resale',
  public_price: '₹1.85 Crore',
  meeting_date: 'Thursday, 15 Oct 2026',
  meeting_time: '11:00 AM',
  meeting_timezone: 'Asia/Kolkata (IST, UTC+05:30)',
  meeting_location: 'Sobha Dream Acres, Panathur Road, Varthur, Bengaluru',
  verification_tier: 'Level 2 Documents Verified (Kaveri 2.0 EC)',
  dashboard_url: 'https://sellmyghar.in/#/dashboard',
  property_url: 'https://sellmyghar.in/#/property/prop-prestige-01',
  cover_image_url: '/images/luxury-apartment-township-sunset.webp',
  year: '2026',
  date: '10 Oct 2026',
};

export type CrmTemplateKey = 
  | 'PROPERTY_SUBMISSION_RECEIVED' 
  | 'MEETING_SCHEDULED' 
  | 'PROPERTY_APPROVED' 
  | 'PROPERTY_PUBLISHED';

export const getTemplateEndpointKey = (key: CrmTemplateKey): string => {
  switch (key) {
    case 'PROPERTY_SUBMISSION_RECEIVED': return 'property-submission-received';
    case 'MEETING_SCHEDULED': return 'meeting-scheduled';
    case 'PROPERTY_APPROVED': return 'property-approved';
    case 'PROPERTY_PUBLISHED': return 'property-published';
  }
};

export const getDefaultTemplateSubject = (key: CrmTemplateKey): string => {
  switch (key) {
    case 'PROPERTY_SUBMISSION_RECEIVED': return 'Your property has been submitted | SellMyGhar.in';
    case 'MEETING_SCHEDULED': return 'Site Visit Confirmed: {{property_title}} on {{meeting_date}} at {{meeting_time}} (IST)';
    case 'PROPERTY_APPROVED': return 'Property Verified & Approved: {{property_title}} | SellMyGhar.in';
    case 'PROPERTY_PUBLISHED': return 'New Verified Resale Listing: {{property_title}} in {{locality}}';
  }
};

export const getDefaultTemplateHtml = (key: CrmTemplateKey): string => {
  switch (key) {
    case 'PROPERTY_SUBMISSION_RECEIVED': return USER_SUBMISSION_TEMPLATE_DEFAULT;
    case 'MEETING_SCHEDULED': return MEETING_TEMPLATE_DEFAULT;
    case 'PROPERTY_APPROVED': return APPROVED_TEMPLATE_DEFAULT;
    case 'PROPERTY_PUBLISHED': return PUBLISHED_TEMPLATE_DEFAULT;
  }
};

// Client-side instant interpolation helper (0ms latency fallback)
export const renderTemplateLocal = (template: string, vars: Record<string, string>): string => {
  if (!template) return '';
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, val);
  }
  return result;
};

export const PublicationEmailManager: React.FC = () => {
  // Current active template key
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<CrmTemplateKey>('PROPERTY_SUBMISSION_RECEIVED');
  
  const [subject, setSubject] = useState('Your property has been submitted | SellMyGhar.in');
  const [htmlBody, setHtmlBody] = useState(USER_SUBMISSION_TEMPLATE_DEFAULT);
  const [providerStatus, setProviderStatus] = useState<EmailProviderStatus | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Preview modal states
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile' | 'full'>('desktop');
  const [previewTab, setPreviewTab] = useState<'rendered' | 'source'>('rendered');
  const [copiedCode, setCopiedCode] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState('ops@sellmyghar.in');
  const [sendingTest, setSendingTest] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async (key: CrmTemplateKey) => {
    setLoading(true);
    try {
      const endpointKey = getTemplateEndpointKey(key);
      const [tplRes, provRes] = await Promise.all([
        fetch(`/api/crm/email-templates/${endpointKey}`),
        fetch('/api/crm/email-provider-status'),
      ]);

      if (tplRes.ok) {
        const tplData = await tplRes.json();
        if (tplData.success && tplData.template) {
          const tpl = tplData.template;
          setSubject(tpl.subject_template || tpl.subject || getDefaultTemplateSubject(key));
          setHtmlBody(tpl.html_template || tpl.html_body || getDefaultTemplateHtml(key));
        }
      } else {
        setSubject(getDefaultTemplateSubject(key));
        setHtmlBody(getDefaultTemplateHtml(key));
      }

      if (provRes.ok) {
        const provData = await provRes.json();
        if (provData.success && provData.status) {
          setProviderStatus(provData.status);
        } else if (provData.configured !== undefined) {
          setProviderStatus({
            provider: provData.provider,
            configured: provData.configured,
            status: provData.status || (provData.configured ? 'CONFIGURED' : 'SIMULATED'),
            details: provData.details || '',
          });
        }
      }
    } catch {
      setSubject(getDefaultTemplateSubject(key));
      setHtmlBody(getDefaultTemplateHtml(key));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedTemplateKey);
  }, [selectedTemplateKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      const endpointKey = getTemplateEndpointKey(selectedTemplateKey);
      const res = await fetch(`/api/crm/email-templates/${endpointKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: selectedTemplateKey,
          subject: subject.trim(),
          subject_template: subject.trim(),
          html_body: htmlBody,
          html_template: htmlBody,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: 'success', message: `Email template (${selectedTemplateKey}) successfully saved!` });
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to update template' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Network error saving template' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset ${selectedTemplateKey} template to standard SellMyGhar brand default?`)) return;
    setSaving(true);
    try {
      const endpointKey = getTemplateEndpointKey(selectedTemplateKey);
      const res = await fetch(`/api/crm/email-templates/${endpointKey}/reset`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_key: selectedTemplateKey })
      });
      const data = await res.json();
      if (res.ok && data.success && data.template) {
        setSubject(data.template.subject_template || data.template.subject);
        setHtmlBody(data.template.html_template || data.template.html_body);
        setNotification({ type: 'success', message: `${selectedTemplateKey} template restored to brand default.` });
      } else {
        setSubject(getDefaultTemplateSubject(selectedTemplateKey));
        setHtmlBody(getDefaultTemplateHtml(selectedTemplateKey));
        setNotification({ type: 'success', message: 'Restored default template from local cache.' });
      }
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setSubject(getDefaultTemplateSubject(selectedTemplateKey));
      setHtmlBody(getDefaultTemplateHtml(selectedTemplateKey));
      setNotification({ type: 'success', message: 'Restored default template from local cache.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Instant Live Preview trigger
  const handlePreview = async () => {
    const localRenderedSubject = renderTemplateLocal(subject, DEFAULT_SAMPLE_VARS);
    const localRenderedHtml = renderTemplateLocal(htmlBody, DEFAULT_SAMPLE_VARS);

    setPreviewSubject(localRenderedSubject);
    setPreviewHtml(localRenderedHtml);
    setShowPreviewModal(true);

    try {
      const endpointKey = getTemplateEndpointKey(selectedTemplateKey);
      const res = await fetch(`/api/crm/email-templates/${endpointKey}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          subject_template: subject,
          html_body: htmlBody,
          html_template: htmlBody,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const finalHtml = data.rendered_html || data.html || localRenderedHtml;
          const finalSubj = data.rendered_subject || data.subject || localRenderedSubject;
          setPreviewHtml(finalHtml);
          setPreviewSubject(finalSubj);
        }
      }
    } catch (err) {
      console.info('[LivePreview] Using local interpolation fallback:', err);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid recipient email address');
      return;
    }

    setSendingTest(true);
    setNotification(null);
    try {
      const endpointKey = getTemplateEndpointKey(selectedTemplateKey);
      const res = await fetch(`/api/crm/email-templates/${endpointKey}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: testEmail.trim(),
          targetEmail: testEmail.trim(),
          subject,
          subject_template: subject,
          html_body: htmlBody,
          html_template: htmlBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const statusText = data.status === 'SIMULATED' ? 'recorded in audit log (simulated)' : 'dispatched via Resend';
        setNotification({
          type: 'success',
          message: `Test email successfully ${statusText}! Notification ID: ${data.notificationId || 'test-live'}`,
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to send test email' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error triggering test dispatch' });
    } finally {
      setSendingTest(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setHtmlBody((prev) => prev + ` ${tag} `);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const placeholderTags = [
    { tag: '{{customer_name}}', desc: 'Seller or customer name e.g. "Ananya Sharma"' },
    { tag: '{{owner_name}}', desc: 'Verified property owner or lead name' },
    { tag: '{{client_name}}', desc: 'Client name for site visit meetings' },
    { tag: '{{property_reference}}', desc: 'Tracking reference code e.g. "SMG-BLR-2026-8841"' },
    { tag: '{{property_type}}', desc: 'Flat, Apartment, Villa e.g. "3 BHK Flat / Apartment"' },
    { tag: '{{property_location}}', desc: 'Full location string e.g. "Varthur / Whitefield, Bengaluru"' },
    { tag: '{{listing_type}}', desc: 'Type of listing e.g. "Assisted Resale"' },
    { tag: '{{dashboard_url}}', desc: 'Direct link to dashboard e.g. "https://sellmyghar.in/#/dashboard"' },
    { tag: '{{year}}', desc: 'Current calendar year e.g. "2026"' },
    { tag: '{{property_title}}', desc: 'Title e.g. "Prestige Lakeside Habitat 3 BHK Flat"' },
    { tag: '{{locality}}', desc: 'Micro-market e.g. "Whitefield"' },
    { tag: '{{bhk}}', desc: 'BHK type e.g. "3 BHK"' },
    { tag: '{{public_price}}', desc: 'Approved asking price e.g. "₹1.85 Crore"' },
    { tag: '{{meeting_date}}', desc: 'Meeting/Visit date e.g. "Thursday, 15 Oct 2026"' },
    { tag: '{{meeting_time}}', desc: 'Meeting/Visit time e.g. "11:00 AM"' },
    { tag: '{{meeting_timezone}}', desc: 'Timezone e.g. "Asia/Kolkata (IST, UTC+05:30)"' },
    { tag: '{{meeting_location}}', desc: 'Meeting location e.g. society address' },
    { tag: '{{specialist_name}}', desc: 'Assigned Senior Resale Specialist' },
    { tag: '{{verification_tier}}', desc: 'Verification status e.g. Level 2 Documents Verified' },
    { tag: '{{property_url}}', desc: 'Direct canonical URL to the listing' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 text-[#172033]">
      
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-[#244B8F]" />
            <h3 className="text-base font-extrabold text-[#172033]">
              Transactional Email Notification Manager
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Edit responsive HTML email templates, preview live dynamic variable interpolation, and test delivery.
          </p>
        </div>

        {/* Truthful Provider Status Badge */}
        <div className="flex items-center space-x-2">
          {providerStatus?.status === 'CONFIGURED' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resend Active ({providerStatus.provider})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulated Delivery (Local Ledger)</span>
            </span>
          )}
        </div>
      </div>

      {/* Template Segmented Control Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTemplateKey('PROPERTY_SUBMISSION_RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedTemplateKey === 'PROPERTY_SUBMISSION_RECEIVED'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Property Listed</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplateKey('MEETING_SCHEDULED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedTemplateKey === 'MEETING_SCHEDULED'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Meeting Scheduled (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplateKey('PROPERTY_APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedTemplateKey === 'PROPERTY_APPROVED'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>3. Property Approved</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplateKey('PROPERTY_PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              selectedTemplateKey === 'PROPERTY_PUBLISHED'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4. Property Published</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          {selectedTemplateKey === 'PROPERTY_SUBMISSION_RECEIVED' && 'Dispatched to flat owner upon submission'}
          {selectedTemplateKey === 'MEETING_SCHEDULED' && 'Dispatched to client with valid .ics calendar invite'}
          {selectedTemplateKey === 'PROPERTY_APPROVED' && 'Dispatched to seller once title review is approved'}
          {selectedTemplateKey === 'PROPERTY_PUBLISHED' && 'Dispatched to buyer alerts when publicly live'}
        </div>
      </div>

      {/* Truthful SMTP Disclosure Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-[#244B8F]" />
          <span>Email Subsystem Status</span>
        </div>
        <p className="text-[11px] text-slate-500">
          {providerStatus?.details || 'Idempotent dispatch logic active. Records notifications to database audit ledger.'}
        </p>
      </div>

      {/* Alert Notifications */}
      {notification && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">Loading email template...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Subject Line */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-none"
              placeholder="e.g. Your property has been submitted | SellMyGhar.in"
            />
          </div>

          {/* Interpolation Tags Helper */}
          <div>
            <span className="block font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
              Available Dynamic Template Placeholders (Click to Insert)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {placeholderTags.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertPlaceholder(t.tag)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-[#244B8F] border border-slate-200/80 font-mono text-[11px] transition-colors cursor-pointer"
                  title={t.desc}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>

          {/* HTML Body Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Responsive HTML Email Template</label>
              <span className="text-[10px] text-slate-400">Complete HTML document supported with tables &amp; inline styles</span>
            </div>
            <textarea
              rows={14}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              className="w-full p-3.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#244B8F] leading-relaxed shadow-inner"
              placeholder="Paste or edit responsive HTML email markup..."
            />
          </div>

          {/* Form Actions & Test Dispatch */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Template'}</span>
              </button>

              <button
                type="button"
                onClick={handlePreview}
                className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#244B8F] border border-blue-200 font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer flex items-center space-x-1"
                title="Restore default branded template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>

            {/* Test Send Input */}
            <div className="flex items-center space-x-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
              />
              <button
                type="button"
                disabled={sendingTest}
                onClick={handleSendTest}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>

          </div>
        </form>
      )}

      {/* Live Email Preview Modal */}
      {showPreviewModal && previewHtml !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* Modal Top Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#38BDF8]" />
                <span className="font-bold text-xs">Live Email Preview</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedTemplateKey === 'PROPERTY_SUBMISSION_RECEIVED' ? 'Seller Submission Confirmation' : 'Publication Alert'}
                </span>
              </div>

              {/* Viewport switchers & close */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      previewViewport === 'desktop' ? 'bg-[#244B8F] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Desktop Email Client Canvas (600px)"
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop (600px)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      previewViewport === 'mobile' ? 'bg-[#244B8F] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Mobile View (375px)"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile (375px)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewViewport('full')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      previewViewport === 'full' ? 'bg-[#244B8F] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Full Width"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Full</span>
                  </button>
                </div>

                {/* Tab switch between Rendered & Raw */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('rendered')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                      previewTab === 'rendered' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Rendered
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('source')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                      previewTab === 'source' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    HTML Source
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer ml-2 border border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Email Header Metadata Simulation */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500 w-16">Subject:</span>
                  <span className="font-extrabold text-slate-900">{previewSubject || subject}</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>TLS 1.3 &bull; DKIM Verified</span>
                </span>
              </div>
              <div className="flex items-center text-slate-600 text-[11px]">
                <span className="font-bold text-slate-500 w-16">From:</span>
                <span>SellMyGhar Concierge &lt;notifications@sellmyghar.in&gt;</span>
              </div>
              <div className="flex items-center text-slate-600 text-[11px]">
                <span className="font-bold text-slate-500 w-16">To:</span>
                <span>Ananya Sharma &lt;ananya.sharma@example.com&gt;</span>
              </div>
            </div>

            {/* Preview Body Area */}
            <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-6 flex justify-center items-start min-h-[500px]">
              
              {previewTab === 'rendered' ? (
                <div 
                  className={`bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-200 border border-slate-300 w-full ${
                    previewViewport === 'desktop'
                      ? 'max-w-[640px]'
                      : previewViewport === 'mobile'
                      ? 'max-w-[375px]'
                      : 'max-w-full'
                  }`}
                >
                  {/* Clean Sandboxed Iframe for 100% Authentic HTML Email Rendering */}
                  <iframe
                    srcDoc={previewHtml}
                    title="Email Template Rendered Preview"
                    className="w-full h-[620px] border-0 bg-[#F4F6F9] block"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              ) : (
                <div className="w-full max-w-3xl bg-slate-900 rounded-xl p-4 text-slate-100 font-mono text-xs overflow-x-auto relative">
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>Interpolated HTML Output</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(previewHtml)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy HTML'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
                    {previewHtml}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer with quick test send */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-slate-500">
                Sample dynamic variables (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Ananya Sharma</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">SMG-BLR-2026-8841</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">₹1.85 Crore</code>) rendered into preview.
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs w-44"
                />
                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={handleSendTest}
                  className="px-3.5 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
