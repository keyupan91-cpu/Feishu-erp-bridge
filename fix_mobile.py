import re

with open("D:/金蝶数据传输平台/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 定义新的完整移动端视图
new_mobile_view = '''  // 移动端视图
  if (isMobile) {
    return (
      <div className="app-container mobile-view">
        <TopNavBar
          title="金蝶数据传输"
          rightContent={<Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} size="small" />}
        />
        <div className="mobile-content-wrapper">
          {activeTab === 'tasks' && (
            <>
              <div className="mobile-stat-cards">
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>总任务数</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{tasks.length}</div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#E6F7FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UnorderedListOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    </div>
                  </div>
                </Card>
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>今日执行</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        {taskInstances.filter(i => i.startTime && new Date(i.startTime).toDateString() === new Date().toDateString()).length}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#F6FFED', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                    </div>
                  </div>
                </Card>
                <Card className="stat-card" size="small">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>今日失败</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                        {taskInstances.filter(i => i.startTime && new Date(i.startTime).toDateString() === new Date().toDateString() && i.status === TaskStatus.ERROR).length}
                      </div>
                    </div>
                    <div style={{ width: 40, height: 40, background: '#FFF1F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mobile-task-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16 }}>任务列表</Text>
                  <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => { setEditingTask(null); setFormData({ name: '', description: '' }); setIsModalOpen(true); }}>新建</Button>
                </div>
                {tasks.length === 0 ? (<Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />) : (
                  tasks.map(task => (
                    <MobileTaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => { setEditingTask(task); setFormData({ name: task.name, description: task.description || '' }); setIsModalOpen(true); }}
                      onExecute={() => handleStartTask(task.id)}
                      onToggle={() => toggleTask(task.id)}
                    />
                  ))
                )}
              </div>
              <div className="mobile-actions">
                <Button block icon={<ExportOutlined />} onClick={handleExport} size="large">导出数据</Button>
                <Button block icon={<ImportOutlined />} onClick={handleImport} size="large" style={{ marginTop: 8 }}>导入数据</Button>
              </div>
            </>
          )}
          {activeTab === 'monitoring' && (
            <div className="mobile-monitoring">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16 }}>执行记录</Text>
                <Button icon={<ClearOutlined />} onClick={handleClearInstances} disabled={taskInstances.length === 0} size="small">清空</Button>
              </div>
              {taskInstances.length === 0 ? (<Empty description="暂无执行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />) : (
                taskInstances.map(instance => (
                  <MobileTaskInstanceCard
                    key={instance.id}
                    instance={instance}
                    onStop={() => handleStopTask(instance.id)}
                    onViewLogs={() => { setSelectedInstance(instance); setShowWebApiLogs(true); }}
                  />
                ))
              )}
            </div>
          )}
          {activeTab === 'debugger' && (
            <div className="mobile-debugger">
              <WebAPIDebugger />
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="mobile-profile">
              <Card className="stat-card" size="small" style={{ marginBottom: 12 }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 60, height: 60, background: '#E6F7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <UserOutlined style={{ fontSize: 30, color: '#1890ff' }} />
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{currentAccount?.username}</h3>
                  <Text type="secondary" style={{ fontSize: 13 }}>注册时间：{new Date(currentAccount?.createdAt || Date.now()).toLocaleDateString('zh-CN')}</Text>
                </div>
              </Card>
              <div className="mobile-actions">
                <Button block icon={<ExportOutlined />} onClick={handleExport} size="large">导出数据</Button>
                <Button block icon={<ImportOutlined />} onClick={handleImport} size="large" style={{ marginTop: 8 }}>导入数据</Button>
                <Button block danger icon={<LogoutOutlined />} onClick={handleLogout} size="large" style={{ marginTop: 8 }}>退出登录</Button>
              </div>
            </div>
          )}
        </div>
        <BottomNavBar
          activeKey={activeTab}
          onTabChange={setActiveTab}
          items={[
            { key: 'tasks', label: '任务', icon: <UnorderedListOutlined /> },
            { key: 'monitoring', label: '监控', icon: <HistoryOutlined /> },
            { key: 'debugger', label: 'API', icon: <ApiOutlined /> },
            { key: 'profile', label: '我的', icon: <UserOutlined /> },
          ]}
        />
      </div>
    );
  }
  // 桌面端视图'''

# 使用正则表达式找到并替换移动端视图部分
pattern = re.compile(r'  // 移动端视图\n  if \(isMobile\) \{.*?  // 桌面端视图', re.DOTALL)
content = pattern.sub(new_mobile_view, content)

with open("D:/金蝶数据传输平台/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
