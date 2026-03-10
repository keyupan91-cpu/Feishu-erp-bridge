import React, { useState } from 'react';
import { Typography, Card, Collapse, Steps, Alert, Divider, Tag, Button, Space } from 'antd';
import {
  CloudSyncOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  ToolOutlined,
  RocketOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface HelpPageProps {
  onBack?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { key: 'overview', title: '产品概述', icon: <BookOutlined /> },
    { key: 'quickstart', title: '快速开始', icon: <RocketOutlined /> },
    { key: 'tasks', title: '任务管理', icon: <ToolOutlined /> },
    { key: 'config', title: '配置说明', icon: <SettingOutlined /> },
    { key: 'faq', title: '常见问题', icon: <QuestionCircleOutlined /> },
  ];

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={styles.backBtn}
        >
          返回
        </Button>
        <Title level={3} style={styles.title}>
          <QuestionCircleOutlined style={{ marginRight: 12 }} />
          帮助文档
        </Title>
        <div style={{ width: 80 }} />
      </div>

      <div style={styles.content}>
        {/* 左侧导航 */}
        <div style={styles.sidebar}>
          {sections.map((section) => (
            <div
              key={section.key}
              style={{
                ...styles.navItem,
                ...(activeSection === section.key ? styles.navItemActive : {}),
              }}
              onClick={() => setActiveSection(section.key)}
            >
              {section.icon}
              <span style={{ marginLeft: 12 }}>{section.title}</span>
            </div>
          ))}
        </div>

        {/* 右侧内容 */}
        <div style={styles.main}>
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'quickstart' && <QuickStartSection />}
          {activeSection === 'tasks' && <TasksSection />}
          {activeSection === 'config' && <ConfigSection />}
          {activeSection === 'faq' && <FAQSection />}
        </div>
      </div>
    </div>
  );
};

// 产品概述
const OverviewSection: React.FC = () => (
  <div>
    <Title level={4}>产品概述</Title>
    <Paragraph>
      金蝶数据传输平台是一款企业级的数据同步工具，旨在实现飞书多维表格与金蝶ERP系统之间的无缝数据对接。
    </Paragraph>

    <Card style={styles.featureCard}>
      <div style={styles.featureGrid}>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><CloudSyncOutlined /></div>
          <Title level={5}>数据同步</Title>
          <Text type="secondary">自动同步飞书与金蝶之间的数据，支持单向和双向同步</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><DatabaseOutlined /></div>
          <Title level={5}>多数据源</Title>
          <Text type="secondary">支持飞书多维表格、金蝶ERP等多种数据源</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><ApiOutlined /></div>
          <Title level={5}>API调试</Title>
          <Text type="secondary">内置WebAPI调试工具，方便开发调试</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><ThunderboltOutlined /></div>
          <Title level={5}>高效稳定</Title>
          <Text type="secondary">并发处理，断点续传，保证数据一致性</Text>
        </div>
      </div>
    </Card>

    <Divider />

    <Title level={4}>系统架构</Title>
    <Paragraph>
      系统采用前后端分离架构，前端使用React + Ant Design构建，后端使用Node.js + Express实现。
      数据存储在本地服务器，支持多账户数据隔离。
    </Paragraph>

    <Alert
      message="数据安全"
      description="所有数据存储在本地服务器，不涉及云端存储，确保企业数据安全。每个账户的数据完全隔离，互不影响。"
      type="info"
      showIcon
    />
  </div>
);

// 快速开始
const QuickStartSection: React.FC = () => (
  <div>
    <Title level={4}>快速开始</Title>
    <Paragraph>
      跟随以下步骤，快速配置并运行您的第一个数据同步任务。
    </Paragraph>

    <Steps
      direction="vertical"
      current={-1}
      items={[
        {
          title: '创建账户',
          description: '首次使用需要注册账户，账户数据将独立存储在本地服务器。',
          icon: <DatabaseOutlined />,
        },
        {
          title: '创建任务',
          description: '点击「新建任务」按钮，输入任务名称和描述。',
          icon: <ThunderboltOutlined />,
        },
        {
          title: '配置飞书连接',
          description: '填写飞书应用的 AppID、AppSecret、AppToken 和 TableId。',
          icon: <CloudSyncOutlined />,
        },
        {
          title: '配置金蝶连接',
          description: '填写金蝶服务器地址、用户名、密码和表单ID。',
          icon: <DatabaseOutlined />,
        },
        {
          title: '测试连接',
          description: '使用「测试连接」功能验证配置是否正确。',
          icon: <CheckCircleOutlined />,
        },
        {
          title: '执行任务',
          description: '启用任务并点击「执行」按钮开始数据同步。',
          icon: <RocketOutlined />,
        },
      ]}
    />
  </div>
);

// 任务管理
const TasksSection: React.FC = () => (
  <div>
    <Title level={4}>任务管理</Title>

    <Collapse
      defaultActiveKey={['1', '2', '3']}
      items={[
        {
          key: '1',
          label: '创建任务',
          children: (
            <div>
              <Paragraph>
                点击任务列表上方的「新建任务」按钮，填写任务名称和描述后保存。
              </Paragraph>
              <Alert
                message="提示"
                description="任务名称建议使用有意义的描述，方便后续管理和识别。"
                type="info"
              />
            </div>
          ),
        },
        {
          key: '2',
          label: '配置任务',
          children: (
            <div>
              <Paragraph>
                点击任务卡片上的「配置」按钮，进入任务配置页面。
              </Paragraph>
              <Title level={5}>飞书配置</Title>
              <ul>
                <li><Text code>App ID</Text> - 飞书开放平台应用ID</li>
                <li><Text code>App Secret</Text> - 飞书开放平台应用密钥</li>
                <li><Text code>App Token</Text> - 多维表格的应用Token</li>
                <li><Text code>Table ID</Text> - 数据表格ID</li>
              </ul>
              <Title level={5}>金蝶配置</Title>
              <ul>
                <li><Text code>服务器地址</Text> - 金蝶WebAPI服务地址</li>
                <li><Text code>用户名/密码</Text> - 金蝶系统登录凭证</li>
                <li><Text code>账套ID</Text> - 金蝶账套标识</li>
                <li><Text code>表单ID</Text> - 目标表单标识</li>
              </ul>
            </div>
          ),
        },
        {
          key: '3',
          label: '执行任务',
          children: (
            <div>
              <Paragraph>
                任务配置完成后，点击「启用」开关启用任务，然后点击「执行」按钮开始同步。
              </Paragraph>
              <Alert
                message="注意"
                description="执行过程中请勿关闭浏览器，任务将在后台持续运行直到完成。"
                type="warning"
              />
            </div>
          ),
        },
      ]}
    />
  </div>
);

// 配置说明
const ConfigSection: React.FC = () => (
  <div>
    <Title level={4}>配置说明</Title>

    <Card title="飞书应用配置" style={{ marginBottom: 16 }}>
      <Paragraph>
        在飞书开放平台创建企业自建应用，获取以下信息：
      </Paragraph>
      <ol>
        <li>登录飞书开放平台 (open.feishu.cn)</li>
        <li>创建企业自建应用</li>
        <li>在「凭证与基础信息」获取 App ID 和 App Secret</li>
        <li>在「权限管理」开通多维表格相关权限</li>
        <li>发布应用到企业内部</li>
      </ol>
    </Card>

    <Card title="金蝶WebAPI配置" style={{ marginBottom: 16 }}>
      <Paragraph>
        确保金蝶WebAPI服务已正确部署和配置：
      </Paragraph>
      <ol>
        <li>确认金蝶服务器WebAPI服务已启动</li>
        <li>确认能够通过浏览器访问WebAPI地址</li>
        <li>确认用户名和密码正确</li>
        <li>确认账套ID正确</li>
      </ol>
    </Card>

    <Card title="字段映射">
      <Paragraph>
        在任务配置中，需要设置飞书字段与金蝶字段的映射关系。
      </Paragraph>
      <Alert
        message="提示"
        description="字段映射支持多种数据类型转换，如日期格式化、数字精度处理等。"
        type="info"
      />
    </Card>
  </div>
);

// 常见问题
const FAQSection: React.FC = () => (
  <div>
    <Title level={4}>常见问题</Title>

    <Collapse
      items={[
        {
          key: '1',
          label: '飞书连接失败怎么办？',
          children: (
            <div>
              <ul>
                <li>检查 App ID 和 App Secret 是否正确</li>
                <li>确认应用已发布到企业内部</li>
                <li>确认已开通多维表格相关权限</li>
                <li>检查网络连接是否正常</li>
              </ul>
            </div>
          ),
        },
        {
          key: '2',
          label: '金蝶连接失败怎么办？',
          children: (
            <div>
              <ul>
                <li>检查服务器地址是否正确（包含端口号）</li>
                <li>确认用户名和密码正确</li>
                <li>确认账套ID正确</li>
                <li>检查金蝶WebAPI服务是否正常运行</li>
              </ul>
            </div>
          ),
        },
        {
          key: '3',
          label: '数据同步失败怎么办？',
          children: (
            <div>
              <ul>
                <li>查看执行日志，定位具体错误信息</li>
                <li>检查字段映射是否正确</li>
                <li>确认必填字段是否有数据</li>
                <li>使用API调试工具测试接口</li>
              </ul>
            </div>
          ),
        },
        {
          key: '4',
          label: '如何查看同步日志？',
          children: (
            <div>
              <Paragraph>
                在「执行监控」页面，点击记录的「查看详情」按钮，可以查看详细的同步日志。
              </Paragraph>
              <Alert
                message="提示"
                description="日志包含飞书原始数据、导入金蝶的数据、金蝶响应数据以及数据回写信息。"
                type="info"
              />
            </div>
          ),
        },
      ]}
    />
  </div>
);

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  backBtn: {
    color: '#666',
  },
  title: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flex: 1,
    gap: 24,
  },
  sidebar: {
    width: 200,
    flexShrink: 0,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 4,
    color: '#666',
    transition: 'all 0.3s',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
  },
  main: {
    flex: 1,
    overflow: 'auto',
  },
  featureCard: {
    marginBottom: 24,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
  },
  featureItem: {
    textAlign: 'center',
    padding: 24,
  },
  featureIcon: {
    width: 56,
    height: 56,
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    color: '#fff',
    margin: '0 auto 16px',
  },
};

export default HelpPage;