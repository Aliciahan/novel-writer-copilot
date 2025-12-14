import { useState, useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import WorkLibrary from './components/WorkLibrary'
import Settings from './components/Settings'
import WorkEditor from './components/WorkEditor'

function App() {
  const [currentView, setCurrentView] = useState('library') // 'library', 'settings', or 'editor'
  const [currentWork, setCurrentWork] = useState(null)

  useEffect(() => {
    // 监听来自主进程的设置页面显示事件
    const unsubscribe = window.api.onShowSettings(() => {
      setCurrentView('settings')
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleOpenWork = (work) => {
    setCurrentWork(work)
    setCurrentView('editor')
  }

  const handleBackToLibrary = () => {
    setCurrentWork(null)
    setCurrentView('library')
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div style={{ minHeight: '100vh' }}>
        {currentView === 'settings' ? (
          <Settings onBack={() => setCurrentView('library')} />
        ) : currentView === 'editor' && currentWork ? (
          <WorkEditor
            workId={currentWork.id}
            workName={currentWork.name}
            onBack={handleBackToLibrary}
          />
        ) : (
          <WorkLibrary onOpenWork={handleOpenWork} />
        )}
      </div>
    </ConfigProvider>
  )
}

export default App
