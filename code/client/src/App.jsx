import MachineModels from './pages/MachineModels.jsx'
import MainLayout from './components/layout/MainLayout.jsx'

function App() {
  return (
    <MainLayout activePage="Machine Models" onNavigate={() => {}}>
      <MachineModels />
    </MainLayout>
  )
}

export default App
