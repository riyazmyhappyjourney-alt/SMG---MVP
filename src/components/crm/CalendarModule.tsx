import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Phone,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  X
} from 'lucide-react';
import { formatPhoneNumber, formatReadableDate, formatReadableTime } from '../../utils/formatters';

export interface CalendarEvent {
  id: string;
  sourceType: 'VISIT' | 'FOLLOW_UP';
  title: string;
  dateStr: string; // 'YYYY-MM-DD'
  timeStr: string; // '11:00 AM'
  clientName: string;
  clientPhone: string;
  propertyTitle?: string;
  locality?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  status: string; // 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'PENDING'
  notes?: string;
  rawItem: any;
}

interface CalendarModuleProps {
  visits: any[];
  tasks: {
    overdue: any[];
    dueToday: any[];
    upcoming: any[];
  };
  staffList: any[];
  onOpenLead: (leadId: string) => void;
  onOpenProperty?: (propertyId: string) => void;
  onScheduleVisit: () => void;
  onSendWhatsAppReminder: (visitId: string) => void;
  onUpdateVisitStatus?: (visitId: string, status: string) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  visits,
  tasks,
  staffList,
  onOpenLead,
  onOpenProperty,
  onScheduleVisit,
  onSendWhatsAppReminder,
  onUpdateVisitStatus
}) => {
  // Navigation & View Mode
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Filters
  const [filterType, setFilterType] = useState<'ALL' | 'VISIT' | 'FOLLOW_UP'>('ALL');
  const [filterStaff, setFilterStaff] = useState<string>('ALL');

  // Selected Event Popover / Modal
  const [activeModalEvent, setActiveModalEvent] = useState<CalendarEvent | null>(null);

  // Normalize all visits and task follow-ups into unified CalendarEvents
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];

    // 1. Physical Site Visits
    (visits || []).forEach((v) => {
      // Ensure safe visit date
      const vDate = v.visit_date || (v.created_at ? v.created_at.split('T')[0] : '');
      if (!vDate || vDate.startsWith('1970')) return;

      list.push({
        id: `visit-${v.id}`,
        sourceType: 'VISIT',
        title: `${v.client_name || 'Client'} • Site Tour`,
        dateStr: vDate,
        timeStr: formatReadableTime(v.visit_time || '11:00 AM'),
        clientName: v.client_name || 'Client',
        clientPhone: v.client_phone || '',
        propertyTitle: v.property_title || 'Apartment Tour',
        locality: v.property_locality || 'Bengaluru',
        assignedStaffId: v.assigned_staff_id,
        assignedStaffName: v.assigned_staff_name || 'Unassigned',
        status: (v.status || 'SCHEDULED').toUpperCase(),
        notes: v.notes,
        rawItem: v
      });
    });

    // 2. Follow-Up Calls from Tasks
    const allTasksList = [...(tasks?.overdue || []), ...(tasks?.dueToday || []), ...(tasks?.upcoming || [])];
    const seenTaskIds = new Set<string>();

    allTasksList.forEach((t) => {
      if (!t.id || seenTaskIds.has(t.id)) return;
      seenTaskIds.add(t.id);

      if (!t.next_follow_up_at) return;
      const parsedDate = new Date(t.next_follow_up_at);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() <= 1970) return;

      const dateStr = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;

      list.push({
        id: `task-${t.id}`,
        sourceType: 'FOLLOW_UP',
        title: `${t.name || 'Lead'} • Diligence Follow-up`,
        dateStr,
        timeStr: formatReadableTime(t.next_follow_up_at),
        clientName: t.name || 'Lead',
        clientPhone: t.phone || '',
        propertyTitle: t.society || 'Residential Lead',
        locality: t.locality || 'Bengaluru',
        assignedStaffId: t.assigned_staff_id,
        assignedStaffName: t.assigned_staff_name || 'Unassigned',
        status: 'SCHEDULED',
        notes: t.follow_up_notes || 'Scheduled diligence check-in',
        rawItem: t
      });
    });

    return list;
  }, [visits, tasks]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterType !== 'ALL' && ev.sourceType !== filterType) return false;
      if (filterStaff !== 'ALL' && ev.assignedStaffId !== filterStaff) return false;
      return true;
    });
  }, [allEvents, filterType, filterStaff]);

  // Map of events by date 'YYYY-MM-DD'
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const arr = map.get(ev.dateStr) || [];
      arr.push(ev);
      map.set(ev.dateStr, arr);
    });
    return map;
  }, [filteredEvents]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDayDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDayDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute month calendar grid cells
  const monthCells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    const cells: { day: number; dateStr: string; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Leading days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        events: eventsByDate.get(dateStr) || []
      });
    }

    // Trailing days
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || []
      });
    }

    return cells;
  }, [year, month, eventsByDate]);

  // Compute 7 days for Week View
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Mon = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const days: { date: Date; dateStr: string; dayName: string; dayNum: number; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr,
        dayName: DAYS_OF_WEEK[i],
        dayNum: d.getDate(),
        events: eventsByDate.get(dateStr) || []
      });
    }
    return days;
  }, [currentDate, eventsByDate]);

  return (
    <div className="space-y-4">
      {/* Calendar Header with Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Date Navigation */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#244B8F]/10 text-[#244B8F] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold tracking-tight text-[#172033] tabular-nums">
                {MONTH_NAMES[month]} {year}
              </h2>
              <div className="flex items-center space-x-1 ml-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {viewMode === 'week' && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Week: {weekDays[0].dateStr} to {weekDays[6].dateStr}
              </p>
            )}
            {viewMode === 'day' && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Schedule for {formatReadableDate(selectedDayDate)}
              </p>
            )}
          </div>
        </div>

        {/* View Switcher, Filters & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('day');
                setSelectedDayDate(todayStr);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'agenda' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#244B8F] cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="VISIT">Site Visits Only</option>
            <option value="FOLLOW_UP">Follow-up Calls Only</option>
          </select>

          {/* Staff Filter */}
          {staffList && staffList.length > 0 && (
            <select
              value={filterStaff}
              onChange={(e) => setFilterStaff(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-[#244B8F] cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Staff RMs</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName || s.email}
                </option>
              ))}
            </select>
          )}

          {/* Quick Schedule Visit */}
          <button
            type="button"
            onClick={onScheduleVisit}
            className="px-3.5 py-1.5 bg-[#244B8F] hover:bg-[#1B396E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/70 text-center">
            {DAYS_OF_WEEK.map((dw) => (
              <div key={dw} className="py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {dw}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {monthCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const hasEvents = cell.events.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayDate(cell.dateStr);
                    if (hasEvents) {
                      setViewMode('day');
                    }
                  }}
                  className={`min-h-[115px] p-2 flex flex-col transition-colors cursor-pointer ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 text-slate-400'
                  }`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold tabular-nums inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? 'bg-[#244B8F] text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.events.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {cell.events.length} {cell.events.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Events list within cell */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {cell.events.slice(0, 2).map((ev) => {
                      const isVisit = ev.sourceType === 'VISIT';
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalEvent(ev);
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium truncate flex items-center space-x-1.5 transition-shadow hover:shadow-2xs cursor-pointer border ${
                            isVisit
                              ? 'bg-blue-50/80 text-blue-900 border-blue-200/70 hover:bg-blue-100/70'
                              : 'bg-amber-50/80 text-amber-900 border-amber-200/70 hover:bg-amber-100/70'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isVisit ? 'bg-[#244B8F]' : 'bg-amber-600'
                            }`}
                          />
                          <span className="tabular-nums font-semibold shrink-0">{ev.timeStr.split(' ')[0]}</span>
                          <span className="truncate">{ev.clientName}</span>
                        </div>
                      );
                    })}

                    {cell.events.length > 2 && (
                      <div className="text-[10px] font-bold text-slate-500 pl-1">
                        +{cell.events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {weekDays.map((wd) => {
              const isToday = wd.dateStr === todayStr;

              return (
                <div key={wd.dateStr} className="min-h-[380px] p-3 flex flex-col">
                  {/* Day Header */}
                  <div
                    onClick={() => {
                      setSelectedDayDate(wd.dateStr);
                      setViewMode('day');
                    }}
                    className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:opacity-80"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {wd.dayName}
                      </span>
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        {formatReadableDate(wd.dateStr).slice(0, -5)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-[#244B8F] text-white' : 'text-slate-800'
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                  </div>

                  {/* Day Events */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {wd.events.length === 0 ? (
                      <p className="text-[11px] text-slate-300 italic text-center py-8">No events</p>
                    ) : (
                      wd.events.map((ev) => {
                        const isVisit = ev.sourceType === 'VISIT';
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setActiveModalEvent(ev)}
                            className={`p-2.5 rounded-xl border text-xs transition-shadow hover:shadow-xs cursor-pointer ${
                              isVisit
                                ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                                : 'bg-amber-50/50 border-amber-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                  isVisit ? 'bg-[#244B8F] text-white' : 'bg-amber-600 text-white'
                                }`}
                              >
                                {isVisit ? 'VISIT' : 'FOLLOW-UP'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 tabular-nums">{ev.timeStr}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 truncate">{ev.clientName}</h4>
                            <p className="text-[11px] text-slate-500 truncate">{ev.propertyTitle || ev.locality}</p>
                            {ev.assignedStaffName && (
                              <p className="text-[10px] text-slate-400 truncate mt-1">RM: {ev.assignedStaffName}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                Scheduled Agenda for {formatReadableDate(selectedDayDate)}
              </h3>
              <p className="text-xs text-slate-500">
                {(eventsByDate.get(selectedDayDate) || []).length} scheduled operations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className="text-xs font-semibold text-[#244B8F] hover:underline cursor-pointer"
            >
              Back to Month View
            </button>
          </div>

          <div className="space-y-3">
            {(eventsByDate.get(selectedDayDate) || []).length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-500">No events scheduled for this day.</p>
                <button
                  type="button"
                  onClick={onScheduleVisit}
                  className="mt-3 px-3.5 py-1.5 bg-[#244B8F] text-white text-xs font-bold rounded-xl hover:bg-[#1B396E] cursor-pointer"
                >
                  Schedule a Visit for this Date
                </button>
              </div>
            ) : (
              (eventsByDate.get(selectedDayDate) || []).map((ev) => {
                const isVisit = ev.sourceType === 'VISIT';
                return (
                  <div
                    key={ev.id}
                    onClick={() => setActiveModalEvent(ev)}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-shadow hover:shadow-xs ${
                      isVisit ? 'bg-blue-50/40 border-blue-200' : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl text-white flex flex-col items-center justify-center font-bold text-[10px] shrink-0 ${
                          isVisit ? 'bg-[#244B8F]' : 'bg-amber-600'
                        }`}
                      >
                        <span>{isVisit ? 'VISIT' : 'CALL'}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-xs">{ev.title}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-700">
                            {ev.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {ev.propertyTitle} ({ev.locality})
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>Time: {ev.timeStr}</span>
                          <span>•</span>
                          <span>Phone: {formatPhoneNumber(ev.clientPhone)}</span>
                          {ev.assignedStaffName && (
                            <>
                              <span>•</span>
                              <span>RM: {ev.assignedStaffName}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {isVisit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendWhatsAppReminder(ev.rawItem.id);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#244B8F] text-xs font-bold rounded-xl cursor-pointer shadow-2xs flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.sourceType === 'FOLLOW_UP') {
                            onOpenLead(ev.rawItem.id);
                          } else if (onOpenProperty && ev.rawItem.property_id) {
                            onOpenProperty(ev.rawItem.property_id);
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operational Schedule ({filteredEvents.length} total events)
            </h3>
            <span className="text-[11px] text-slate-400">Chronological pipeline</span>
          </div>

          {filteredEvents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">No scheduled events on the operational calendar.</p>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((ev) => {
                const isVisit = ev.sourceType === 'VISIT';
                return (
                  <div
                    key={ev.id}
                    onClick={() => setActiveModalEvent(ev)}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-shadow hover:shadow-xs ${
                      isVisit ? 'border-blue-200/80 bg-blue-50/30' : 'border-amber-200/80 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl text-white flex flex-col items-center justify-center font-bold text-[10px] shrink-0 ${
                          isVisit ? 'bg-[#244B8F]' : 'bg-amber-600'
                        }`}
                      >
                        <span>{isVisit ? 'VISIT' : 'CALL'}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900">{ev.title}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-700">
                            {ev.status}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          {ev.propertyTitle} ({ev.locality})
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Date: {formatReadableDate(ev.dateStr)} at {ev.timeStr} • RM: {ev.assignedStaffName || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {isVisit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendWhatsAppReminder(ev.rawItem.id);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-[#244B8F] font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.sourceType === 'FOLLOW_UP') {
                            onOpenLead(ev.rawItem.id);
                          } else if (onOpenProperty && ev.rawItem.property_id) {
                            onOpenProperty(ev.rawItem.property_id);
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT DETAIL POPOVER MODAL */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                    activeModalEvent.sourceType === 'VISIT' ? 'bg-[#244B8F]' : 'bg-amber-600'
                  }`}
                >
                  {activeModalEvent.sourceType === 'VISIT' ? 'V' : 'C'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                    {activeModalEvent.sourceType === 'VISIT' ? 'Physical Site Visit' : 'Client Diligence Call'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Status: {activeModalEvent.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Client & Contact
                </span>
                <p className="font-bold text-slate-900 text-sm">{activeModalEvent.clientName}</p>
                <p className="text-slate-600 tabular-nums font-medium mt-0.5">
                  {formatPhoneNumber(activeModalEvent.clientPhone)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Date & Time
                  </span>
                  <p className="font-bold text-slate-800 tabular-nums">
                    {formatReadableDate(activeModalEvent.dateStr)}
                  </p>
                  <p className="text-slate-500 tabular-nums font-semibold">{activeModalEvent.timeStr}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Assigned RM
                  </span>
                  <p className="font-bold text-slate-800">{activeModalEvent.assignedStaffName || 'Unassigned'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Target Property / Society
                </span>
                <p className="font-bold text-slate-800">{activeModalEvent.propertyTitle || 'Residential Unit'}</p>
                <p className="text-slate-500">{activeModalEvent.locality || 'Bengaluru'}</p>
              </div>

              {activeModalEvent.notes && (
                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Operational Notes
                  </span>
                  <p className="text-slate-600 text-[11px]">{activeModalEvent.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
              {activeModalEvent.sourceType === 'VISIT' ? (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSendWhatsAppReminder(activeModalEvent.rawItem.id);
                      setActiveModalEvent(null);
                    }}
                    className="px-3 py-1.5 bg-[#244B8F] text-white font-bold rounded-xl text-xs hover:bg-[#1B396E] cursor-pointer flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp Reminder</span>
                  </button>
                  {onUpdateVisitStatus && activeModalEvent.status === 'SCHEDULED' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateVisitStatus(activeModalEvent.rawItem.id, 'COMPLETED');
                        setActiveModalEvent(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLead(activeModalEvent.rawItem.id);
                    setActiveModalEvent(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#244B8F] text-white font-bold rounded-xl text-xs hover:bg-[#1B396E] cursor-pointer"
                >
                  Open Lead Details
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveModalEvent(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
