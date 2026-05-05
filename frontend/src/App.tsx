import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminLayout from './components/AdminLayout'
import AnnotatorLayout from './components/AnnotatorLayout'
import Dashboard from './pages/admin/Dashboard'
import Contexts from './pages/admin/Contexts'
import ContextForm from './pages/admin/ContextForm'
import Errors from './pages/admin/Errors'
import Annotators from './pages/admin/Annotators'
import Assignments from './pages/admin/Assignments'
import AnnotationsView from './pages/admin/AnnotationsView'
import Queue from './pages/annotator/Queue'
import AnnotateContext from './pages/annotator/AnnotateContext'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('role')
  if (!token) return <Navigate to="/login" replace />
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/annotator'} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter basename="/error-annotation">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="contexts" element={<Contexts />} />
          <Route path="contexts/new" element={<ContextForm />} />
          <Route path="contexts/:id/edit" element={<ContextForm />} />
          <Route path="errors" element={<Errors />} />
          <Route path="annotators" element={<Annotators />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="annotations" element={<AnnotationsView />} />
        </Route>

        <Route
          path="/annotator"
          element={
            <RequireAuth role="annotator">
              <AnnotatorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Queue />} />
          <Route path="queue/:assignmentId" element={<AnnotateContext />} />
        </Route>

        <Route
          path="/"
          element={(() => {
            const role = localStorage.getItem('role')
            if (role === 'admin') return <Navigate to="/admin" replace />
            if (role === 'annotator') return <Navigate to="/annotator" replace />
            return <Navigate to="/login" replace />
          })()}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
