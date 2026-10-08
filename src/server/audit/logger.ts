import { AuthenticatedUser } from '../../core/types/auth';
import { AuditLogPrivateRecord } from '../../core/types/entities';
import { executeQuery } from '../db/pool';

/**
 * Immutable Security Audit Logger
 * 
 * Enforces heightened vigilance on STAFF_SUPER_ADMIN actions.
 * Super Admin access to confidential negotiation bounds, raw deeds,
 * or erasure requests are categorized as ELEVATED_INSIDER_RISK.
 */

export type AuditableAction = 
  | 'VIEW_PRIVATE_DOCUMENT'
  | 'APPROVE_LISTING'
  | 'EXPORT_LEADS'
  | 'UPDATE_PRICE'
  | 'VIEW_RESERVE_PRICE'
  | 'DELETE_USER_DATA'
  | 'REVISE_VERIFICATION_TIER'
  | 'DOCUMENT_UPLOAD_IDOR_VIOLATION'
  | 'DOCUMENT_CHECKSUM_VERIFIED'
  | 'LEAD_CREATED'
  | 'LEAD_ASSIGNED'
  | 'LEAD_STATUS_CHANGED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'NOTE_ADDED'
  | 'SITE_VISIT_RECORDED'
  | 'NEGOTIATION_STARTED'
  | 'LEAD_CONVERTED'
  | 'LEAD_LOST'
  | 'DOCUMENT_STATUS_CHANGED'
  | 'PROPERTY_CREATED'
  | 'PROPERTY_UPDATED'
  | 'PROPERTY_PUBLISHED'
  | 'PROPERTY_PAUSED'
  | 'PROPERTY_SOLD'
  | 'PROPERTY_ARCHIVED'
  | 'IMAGE_ADDED'
  | 'IMAGE_REMOVED'
  | 'PRIMARY_IMAGE_CHANGED'
  | 'IMAGE_REORDERED';

export type AlertSeverity = 'ROUTINE' | 'ELEVATED_INSIDER_RISK' | 'CRITICAL_SECURITY_EVENT';

export interface AuditEventPayload {
  actor: AuthenticatedUser;
  action: AuditableAction;
  targetEntity: string;
  targetEntityId: string;
  clientIp: string;
  diffSummary?: Record<string, unknown>;
}

export interface EnrichedAuditLogRecord extends AuditLogPrivateRecord {
  alert_severity: AlertSeverity;
  is_privileged_insider_event: boolean;
}

/**
 * Determines whether an action qualifies as an elevated insider-risk event.
 */
function evaluateInsiderRisk(actor: AuthenticatedUser, action: AuditableAction, targetEntity: string): AlertSeverity {
  const isSuperAdmin = actor.roles.includes('STAFF_SUPER_ADMIN');

  if (isSuperAdmin) {
    // 1. Super Admin inspecting the owner's bottom negotiation line
    if (action === 'VIEW_RESERVE_PRICE' || action === 'UPDATE_PRICE') {
      return 'ELEVATED_INSIDER_RISK';
    }

    // 2. Super Admin reading raw legal title documents
    if (action === 'VIEW_PRIVATE_DOCUMENT' || targetEntity === 'documents') {
      return 'ELEVATED_INSIDER_RISK';
    }

    // 3. Super Admin triggering DPDP data erasure or bulk export
    if (action === 'DELETE_USER_DATA' || action === 'EXPORT_LEADS') {
      return 'CRITICAL_SECURITY_EVENT';
    }
  }

  // Any erasure request or IDOR attempt regardless of role is critical
  if (action === 'DELETE_USER_DATA' || action === 'DOCUMENT_UPLOAD_IDOR_VIOLATION') {
    return 'CRITICAL_SECURITY_EVENT';
  }

  return 'ROUTINE';
}

export async function recordAuditEvent(event: AuditEventPayload): Promise<EnrichedAuditLogRecord> {
  const severity = evaluateInsiderRisk(event.actor, event.action, event.targetEntity);
  const isInsiderEvent = severity !== 'ROUTINE';

  const auditRecord: EnrichedAuditLogRecord = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    actor_id: event.actor.uid,
    actor_role: event.actor.roles[0] || 'SYSTEM',
    action: event.action,
    target_entity: event.targetEntity,
    target_entity_id: event.targetEntityId,
    ip_address: event.clientIp,
    timestamp: new Date().toISOString(),
    diff_summary: {
      ...event.diffSummary,
      _evaluated_severity: severity,
    },
    alert_severity: severity,
    is_privileged_insider_event: isInsiderEvent,
  };

  // Structured logging for Cloud Logging / SIEM alert dispatch
  const logPayload = {
    level: isInsiderEvent ? 'ALERT' : 'INFO',
    severity: severity,
    insider_risk_flag: isInsiderEvent,
    event: auditRecord.action,
    actor_id: auditRecord.actor_id,
    actor_roles: event.actor.roles,
    target: `${auditRecord.target_entity}:${auditRecord.target_entity_id}`,
    client_ip: auditRecord.ip_address,
    timestamp: auditRecord.timestamp
  };

  if (severity === 'CRITICAL_SECURITY_EVENT' || severity === 'ELEVATED_INSIDER_RISK') {
    // In production, this immediately triggers a Cloud Pub/Sub message or Slack/PagerDuty security webhook
    console.warn(`[SECURITY ALERT - ${severity}] Super Admin Privileged Access:`, JSON.stringify(logPayload));
  } else {
    console.info('[AUDIT]', JSON.stringify(logPayload));
  }

  // Persist to PostgreSQL audit_logs table
  try {
    await executeQuery(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_entity, target_entity_id, ip_address, diff_summary, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        auditRecord.id,
        auditRecord.actor_id,
        auditRecord.actor_role,
        auditRecord.action,
        auditRecord.target_entity,
        auditRecord.target_entity_id,
        auditRecord.ip_address,
        JSON.stringify(auditRecord.diff_summary || {}),
      ]
    );
  } catch (dbErr: any) {
    console.warn('[AuditLogger] Note on persisting to audit_logs table:', dbErr.message);
  }

  return auditRecord;
}
