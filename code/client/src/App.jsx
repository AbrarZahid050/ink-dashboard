import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import MachineModels from './pages/MachineModels.jsx'
import MainLayout from './components/layout/MainLayout.jsx'

function App() {
  const [activePage, setActivePage] = useState('Overview')

  const pageContent = activePage === 'Machine Models'
    ? <MachineModels />
    : <Dashboard />

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      {pageContent}
    </MainLayout>
  )
}

export default App
