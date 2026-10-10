import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Phone,
  Send,
  Eye,
  Kanban,
  Table as TableIcon,
  User,
  ArrowRight
} from 'lucide-react';
import { formatPhoneNumber, formatReadableDate, formatReadableTime } from '../../utils/formatters';
import { DateTimePicker } from '../common/DateTimePicker';

interface TasksKanbanModuleProps {
  tasks: {
    overdue: any[];
    dueToday: any[];
    upcoming: any[];
  };
  leads?: any[];
  onOpenLead: (leadId: string) => void;
  onRescheduleLead?: (leadId: string, newDate: string, newTime: string) => Promise<void>;
  onMarkLeadContacted?: (leadId: string) => Promise<void>;
}

export const TasksKanbanModule: React.FC<TasksKanbanModuleProps> = ({
  tasks,
  leads = [],
  onOpenLead,
  onRescheduleLead,
  onMarkLeadContacted
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQueueTab, setActiveQueueTab] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');

  // Reschedule state
  const [rescheduleLeadId, setRescheduleLeadId] = useState<string | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Completed items from leads (leads with lead_status === 'CONTACTED' or 'CONVERTED' or null next_follow_up_at)
  const completedLeads = useMemo(() => {
    return (leads || []).filter((l) => ['CONTACTED', 'CONVERTED', 'SITE_VISIT'].includes(l.lead_status) && !l.next_follow_up_at);
  }, [leads]);

  // Combined and filtered task lists
  const filterTask = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (item.name || item.owner_name || '').toLowerCase().includes(q);
    const phoneMatch = (item.phone || '').includes(q);
    const societyMatch = (item.society || item.apartment_society_name || '').toLowerCase().includes(q);
    const localityMatch = (item.locality || item.locality_id || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || societyMatch || localityMatch;
  };

  const filteredOverdue = useMemo(() => tasks.overdue.filter(filterTask), [tasks.overdue, searchQuery]);
  const filteredDueToday = useMemo(() => tasks.dueToday.filter(filterTask), [tasks.dueToday, searchQuery]);
  const filteredUpcoming = useMemo(() => tasks.upcoming.filter(filterTask), [tasks.upcoming, searchQuery]);
  const filteredCompleted = useMemo(() => completedLeads.filter(filterTask), [completedLeads, searchQuery]);

  // Flattened for table view
  const allTableRows = useMemo(() => {
    const list: { item: any; queue: 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED' }[] = [];

    if (activeQueueTab === 'ALL' || activeQueueTab === 'OVERDUE') {
      filteredOverdue.forEach((t) => list.push({ item: t, queue: 'OVERDUE' }));
    }
    if (activeQueueTab === 'ALL' || activeQueueTab === 'TODAY') {
      filteredDueToday.forEach((t) => list.push({ item: t, queue: 'TODAY' }));
    }
    if (activeQueueTab === 'ALL' || activeQueueTab === 'UPCOMING') {
      filteredUpcoming.forEach((t) => list.push({ item: t, queue: 'UPCOMING' }));
    }
    if (activeQueueTab === 'COMPLETED') {
      filteredCompleted.forEach((t) => list.push({ item: t, queue: 'COMPLETED' }));
    }

    return list;
  }, [activeQueueTab, filteredOverdue, filteredDueToday, filteredUpcoming, filteredCompleted]);

  const handleStartReschedule = (leadId: string) => {
    setRescheduleLeadId(leadId);
    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = async (dateStr: string, timeStr: string, combinedIso: string) => {
    if (rescheduleLeadId && onRescheduleLead) {
      await onRescheduleLead(rescheduleLeadId, dateStr, timeStr);
    }
    setIsRescheduleOpen(false);
    setRescheduleLeadId(null);
  };

  return (
    <div className="space-y-4">
      {/* Title & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#172033]">Tasks & Follow-ups</h2>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              viewMode === 'kanban' ? 'bg-white text-[#244B8F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search follow-ups by client, phone, society..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#244B8F] focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Queue Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveQueueTab('ALL')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              activeQueueTab === 'ALL'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>All Follow-ups</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeQueueTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tasks.overdue.length + tasks.dueToday.length + tasks.upcoming.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('OVERDUE')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              activeQueueTab === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Overdue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeQueueTab === 'OVERDUE' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-800'
              }`}
            >
              {tasks.overdue.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('TODAY')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              activeQueueTab === 'TODAY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Due Today</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeQueueTab === 'TODAY' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
              }`}
            >
              {tasks.dueToday.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('UPCOMING')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              activeQueueTab === 'UPCOMING'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Upcoming</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeQueueTab === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {tasks.upcoming.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('COMPLETED')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
              activeQueueTab === 'COMPLETED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                activeQueueTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {completedLeads.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Client & Contact</th>
                  <th className="py-3 px-4">Property / Society</th>
                  <th className="py-3 px-4">Queue Status</th>
                  <th className="py-3 px-4">Scheduled Due Date & Time</th>
                  <th className="py-3 px-4">Follow-up Objective & Notes</th>
                  <th className="py-3 px-4">Assigned RM</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No follow-up tasks found in this queue.
                    </td>
                  </tr>
                ) : (
                  allTableRows.map(({ item, queue }) => {
                    const clientName = item.name || item.owner_name || 'Client';
                    const clientPhone = item.phone || '';
                    const society = item.society || item.apartment_society_name || '—';
                    const locality = item.locality || item.locality_id || 'Bengaluru';
                    const notes = item.follow_up_notes || item.notes || 'Routine touchpoint';
                    const staffName = item.assigned_staff_name || 'Unassigned';

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onOpenLead(item.id)}
                      >
                        {/* Client & Phone */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 text-xs">{clientName}</p>
                          <p className="text-slate-500 font-medium tabular-nums mt-0.5">
                            {formatPhoneNumber(clientPhone)}
                          </p>
                        </td>

                        {/* Property / Society */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{society}</p>
                          <p className="text-[11px] text-slate-500">{locality}</p>
                        </td>

                        {/* Queue Status */}
                        <td className="py-3.5 px-4">
                          {queue === 'OVERDUE' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" /> Overdue
                            </span>
                          )}
                          {queue === 'TODAY' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 mr-1" /> Due Today
                            </span>
                          )}
                          {queue === 'UPCOMING' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Calendar className="w-2.5 h-2.5 mr-1" /> Upcoming
                            </span>
                          )}
                          {queue === 'COMPLETED' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Completed
                            </span>
                          )}
                        </td>

                        {/* Scheduled Date & Time */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 tabular-nums">
                            {formatReadableDate(item.next_follow_up_at)}
                          </p>
                          <p className="text-[11px] text-slate-500 font-semibold tabular-nums">
                            {formatReadableTime(item.next_follow_up_at)}
                          </p>
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 line-clamp-2 text-xs">{notes}</p>
                        </td>

                        {/* Assigned RM */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700">{staffName}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartReschedule(item.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#244B8F] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg cursor-pointer transition-colors"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenLead(item.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>Showing {allTableRows.length} tasks in active queue</span>
            <span className="font-medium">Click any row to open full lead workspace</span>
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {/* COLUMN 1: OVERDUE */}
          <div className="bg-slate-50/80 rounded-2xl border border-rose-200/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">Overdue</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 tabular-nums">
                {filteredOverdue.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredOverdue.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No overdue follow-ups</p>
              ) : (
                filteredOverdue.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenLead(t.id)}
                    className="p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 tabular-nums font-medium">
                          {formatPhoneNumber(t.phone)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        OVERDUE
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {t.society || 'Residential Lead'}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="tabular-nums font-semibold text-rose-700">
                        {formatReadableDate(t.next_follow_up_at)}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.assigned_staff_name || 'Unassigned'}</span>
                    </div>

                    <div
                      className="pt-2 flex items-center justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartReschedule(t.id)}
                        className="px-2 py-0.5 text-[10px] font-bold text-[#244B8F] hover:bg-blue-50 rounded"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: DUE TODAY */}
          <div className="bg-slate-50/80 rounded-2xl border border-amber-200/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Due Today</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 tabular-nums">
                {filteredDueToday.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredDueToday.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No tasks due today</p>
              ) : (
                filteredDueToday.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenLead(t.id)}
                    className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 tabular-nums font-medium">
                          {formatPhoneNumber(t.phone)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {t.society || 'Residential Lead'}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="tabular-nums font-semibold text-amber-800">
                        {formatReadableTime(t.next_follow_up_at)}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.assigned_staff_name || 'Unassigned'}</span>
                    </div>

                    <div
                      className="pt-2 flex items-center justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartReschedule(t.id)}
                        className="px-2 py-0.5 text-[10px] font-bold text-[#244B8F] hover:bg-blue-50 rounded"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 3: UPCOMING */}
          <div className="bg-slate-50/80 rounded-2xl border border-emerald-200/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Upcoming</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 tabular-nums">
                {filteredUpcoming.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredUpcoming.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No upcoming tasks</p>
              ) : (
                filteredUpcoming.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenLead(t.id)}
                    className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 tabular-nums font-medium">
                          {formatPhoneNumber(t.phone)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        UPCOMING
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      {t.society || 'Residential Lead'}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="tabular-nums font-semibold text-emerald-800">
                        {formatReadableDate(t.next_follow_up_at)}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.assigned_staff_name || 'Unassigned'}</span>
                    </div>

                    <div
                      className="pt-2 flex items-center justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleStartReschedule(t.id)}
                        className="px-2 py-0.5 text-[10px] font-bold text-[#244B8F] hover:bg-blue-50 rounded"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 4: COMPLETED */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Completed</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 tabular-nums">
                {filteredCompleted.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredCompleted.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No completed tasks yet</p>
              ) : (
                filteredCompleted.slice(0, 10).map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onOpenLead(l.id)}
                    className="p-3 bg-white/80 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer space-y-2 opacity-90"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{l.owner_name}</h4>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {formatPhoneNumber(l.phone)}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {l.lead_status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {l.apartment_society_name}
                    </p>

                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Status updated</span>
                      <span>RM: {l.assigned_staff_name || 'Unassigned'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule DateTimePicker Modal */}
      <DateTimePicker
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setRescheduleLeadId(null);
        }}
        onConfirm={handleConfirmReschedule}
        title="Reschedule Client Follow-up"
      />
    </div>
  );
};
