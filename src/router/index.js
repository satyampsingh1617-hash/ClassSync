import { createRouter, createWebHistory } from 'vue-router'

const LoginView         = () => import('../views/LoginView.vue')
const ChangePassword    = () => import('../views/ChangePassword.vue')

// Admin
const AdminDashboard    = () => import('../views/admin/AdminDashboard.vue')
const AdminUsers        = () => import('../views/admin/AdminUsers.vue')
const AdminStudents     = () => import('../views/admin/AdminStudents.vue')
const AdminTeachers     = () => import('../views/admin/AdminTeachers.vue')
const AdminSubjects     = () => import('../views/admin/AdminSubjects.vue')
const AdminAttendance   = () => import('../views/admin/AdminAttendance.vue')
const AdminPapers       = () => import('../views/admin/AdminPapers.vue')

// Teacher
const TeacherDashboard  = () => import('../views/teacher/TeacherDashboard.vue')
const TeacherAttendance = () => import('../views/teacher/TeacherAttendance.vue')
const TeacherStudents   = () => import('../views/teacher/TeacherStudents.vue')
const TeacherNotes      = () => import('../views/teacher/TeacherNotes.vue')
const TeacherPaperPrint = () => import('../views/teacher/TeacherPaperPrint.vue')
const TeacherAnnouncements = () => import('../views/teacher/TeacherAnnouncements.vue')
const TeacherQueries    = () => import('../views/teacher/TeacherQueries.vue')
const TeacherClassOverview = () => import('../views/teacher/TeacherClassOverview.vue')
const TeacherDefaulters   = () => import('../views/teacher/TeacherDefaulters.vue')
const TeacherProfile      = () => import('../views/teacher/TeacherProfile.vue')

// Student
const StudentDashboard  = () => import('../views/student/StudentDashboard.vue')
const StudentAttendance = () => import('../views/student/StudentAttendance.vue')
const StudentNotes      = () => import('../views/student/StudentNotes.vue')
const StudentAnnouncements = () => import('../views/student/StudentAnnouncements.vue')
const StudentQueries    = () => import('../views/student/StudentQueries.vue')
const StudentProfile    = () => import('../views/student/StudentProfile.vue')

// Admin
const AdminAnnouncements = () => import('../views/admin/AdminAnnouncements.vue')
const AdminViolations    = () => import('../views/admin/AdminViolations.vue')

const NotFound = () => import('../views/NotFound.vue')

const routes = [
  { path: '/',      redirect: '/login' },
  { path: '/login', component: LoginView, meta: { guest: true } },
  { path: '/change-password', component: ChangePassword, meta: { auth: true } },

  // ── Admin ──────────────────────────────────────────────────
  { path: '/admin',                  component: AdminDashboard,      meta: { auth: true, role: 'admin' } },
  { path: '/admin/users',            component: AdminUsers,          meta: { auth: true, role: 'admin' } },
  { path: '/admin/students',         component: AdminStudents,       meta: { auth: true, role: 'admin' } },
  { path: '/admin/teachers',         component: AdminTeachers,       meta: { auth: true, role: 'admin' } },
  { path: '/admin/subjects',         component: AdminSubjects,       meta: { auth: true, role: 'admin' } },
  { path: '/admin/attendance',       component: AdminAttendance,     meta: { auth: true, role: 'admin' } },
  { path: '/admin/papers',           component: AdminPapers,         meta: { auth: true, role: 'admin' } },
  { path: '/admin/announcements',    component: AdminAnnouncements,  meta: { auth: true, role: 'admin' } },
  { path: '/admin/violations',       component: AdminViolations,     meta: { auth: true, role: 'admin' } },

  // ── Teacher ────────────────────────────────────────────────
  { path: '/teacher',                    component: TeacherDashboard,     meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/students',           component: TeacherStudents,      meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/attendance',         component: TeacherAttendance,    meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/notes',              component: TeacherNotes,         meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/paper-print',        component: TeacherPaperPrint,    meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/announcements',      component: TeacherAnnouncements, meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/queries',            component: TeacherQueries,       meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/class-overview',     component: TeacherClassOverview, meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/defaulters',         component: TeacherDefaulters,    meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/violations',         component: AdminViolations,      meta: { auth: true, role: 'teacher' } },
  { path: '/teacher/profile',            component: TeacherProfile,       meta: { auth: true, role: 'teacher' } },

  // ── Student ────────────────────────────────────────────────
  { path: '/student',                    component: StudentDashboard,     meta: { auth: true, role: 'student' } },
  { path: '/student/attendance',         component: StudentAttendance,    meta: { auth: true, role: 'student' } },
  { path: '/student/notes',              component: StudentNotes,         meta: { auth: true, role: 'student' } },
  { path: '/student/announcements',      component: StudentAnnouncements, meta: { auth: true, role: 'student' } },
  { path: '/student/queries',            component: StudentQueries,       meta: { auth: true, role: 'student' } },
  { path: '/student/profile',            component: StudentProfile,       meta: { auth: true, role: 'student' } },

  { path: '/:pathMatch(.*)*', component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.auth && !token) return next('/login')
  if (to.meta.guest && token) {
    const dash = { admin: '/admin', teacher: '/teacher', student: '/student' }
    return next(dash[user?.role] || '/login')
  }
  if (to.meta.role && user?.role !== to.meta.role) {
    // Admin with teacherRef can access teacher routes
    const isAdminTeacher = user?.role === 'admin' && user?.teacherRef && to.meta.role === 'teacher'
    if (!isAdminTeacher) {
      const dash = { admin: '/admin', teacher: '/teacher', student: '/student' }
      return next(dash[user?.role] || '/login')
    }
  }
  if (token && user?.mustChangePassword && to.path !== '/change-password') {
    return next('/change-password')
  }
  next()
})

export default router
