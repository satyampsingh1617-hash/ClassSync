// ── Standardized class list ───────────────────────────────────
export const CLASS_LIST = ['FYCS', 'FYIT', 'SYCS', 'SYIT', 'TYCS', 'TYIT']

// ── Fixed time slots ──────────────────────────────────────────
export const TIME_SLOTS = [
  '8:00 AM - 9:00 AM',
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
]

// ── Class chip colors (Tailwind classes) ──────────────────────
export const CLASS_COLORS = {
  FYCS: { chip: 'bg-blue-50 text-blue-700 border-blue-200',    avatar: 'bg-blue-100 text-blue-700'    },
  FYIT: { chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', avatar: 'bg-indigo-100 text-indigo-700' },
  SYCS: { chip: 'bg-violet-50 text-violet-700 border-violet-200', avatar: 'bg-violet-100 text-violet-700' },
  SYIT: { chip: 'bg-purple-50 text-purple-700 border-purple-200', avatar: 'bg-purple-100 text-purple-700' },
  TYCS: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', avatar: 'bg-emerald-100 text-emerald-700' },
  TYIT: { chip: 'bg-teal-50 text-teal-700 border-teal-200',    avatar: 'bg-teal-100 text-teal-700'    },
}

export const getClassChip   = (cls) => CLASS_COLORS[cls]?.chip   || 'bg-surface-100 text-surface-600 border-surface-200'
export const getClassAvatar = (cls) => CLASS_COLORS[cls]?.avatar || 'bg-surface-100 text-surface-600'
