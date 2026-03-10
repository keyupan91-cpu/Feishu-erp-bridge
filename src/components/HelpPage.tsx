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
  SafetyOutlined,
  BugOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface HelpPageProps {
  onBack?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { key: 'overview', title: '产品概述', icon: <BookOutlined /> },
    { key: 'background', title: '开发背景', icon: <BugOutlined /> },
    { key: 'architecture', title: '系统架构', icon: <ToolOutlined /> },
    { key: 'quickstart', title: '快速开始', icon: <RocketOutlined /> },
    { key: 'tips', title: '最佳实践', icon: <ThunderboltOutlined /> },
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
          {activeSection === 'background' && <BackgroundSection />}
          {activeSection === 'architecture' && <ArchitectureSection />}
          {activeSection === 'quickstart' && <QuickStartSection />}
          {activeSection === 'tips' && <TipsSection />}
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
      金蝶数据传输平台是一款专注于<strong>飞书多维表格到金蝶ERP单向数据同步</strong>的高效工具。
      通过将复杂的飞书集成工作流转换为简单的WebAPI参数填充，大幅降低了开发难度，
      同时实现了<strong>10倍速度提升</strong>。
    </Paragraph>

    <Card style={styles.featureCard}>
      <div style={styles.featureGrid}>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><ThunderboltFilled /></div>
          <Title level={5}>10倍速度提升</Title>
          <Text type="secondary">平均0.3-0.5秒/条，3条并行处理</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><ToolOutlined /></div>
          <Title level={5}>极简操作</Title>
          <Text type="secondary">下拉选择字段，无需手动填写</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><SafetyOutlined /></div>
          <Title level={5}>安全可靠</Title>
          <Text type="secondary">本地部署，数据完全隔离</Text>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}><ApiOutlined /></div>
          <Title level={5}>灵活配置</Title>
          <Text type="secondary">支持多任务、多表单同步</Text>
        </div>
      </div>
    </Card>

    <Divider />

    <Title level={4}>核心优势</Title>
    <Card style={{ marginBottom: 16 }}>
      <ul style={{ lineHeight: 2.2, margin: 0, paddingLeft: 20 }}>
        <li><strong>开发难度极低</strong>：无需编写代码，仅需配置参数即可完成同步</li>
        <li><strong>避免人为错误</strong>：字段自动查找，下拉选择，杜绝手填打错字</li>
        <li><strong>统一字段处理</strong>：自动匹配飞书与金蝶字段，无需担心格式问题</li>
        <li><strong>多任务管理</strong>：支持创建多个同步任务，一键启动</li>
        <li><strong>数据安全</strong>：所有数据存储在本地服务器，账户数据完全隔离</li>
      </ul>
    </Card>

    <Alert
      message="安全性说明"
      description="本系统采用本地部署模式，所有数据存储在您的本地服务器中，不涉及云端存储。每个账户的数据完全独立隔离，确保企业数据安全。"
      type="info"
      showIcon
      icon={<SafetyOutlined />}
    />
  </div>
);

// 开发背景
const BackgroundSection: React.FC = () => (
  <div>
    <Title level={4}>开发背景</Title>
    <Paragraph>
      在飞书多维表格导入金蝶ERP的场景中，主流方案是使用<strong>飞书集成工作流</strong>，
      但实际使用中存在诸多痛点：
    </Paragraph>

    <Card title="传统方案痛点" style={{ marginBottom: 24 }}>
      <div style={styles.painPointGrid}>
        <div style={styles.painPointItem}>
          <div style={styles.painPointIcon}><ThunderboltOutlined /></div>
          <Title level={5}>执行速度慢</Title>
          <Text type="secondary">
            工作流循环执行，平均3-5秒/条记录。<br/>
            同步2000条数据需要<strong>2-3小时</strong>。
          </Text>
        </div>
        <div style={styles.painPointItem}>
          <div style={styles.painPointIcon}><ApiOutlined /></div>
          <Title level={5}>接口不完善</Title>
          <Text type="secondary">
            很多金蝶接口不支持，<br/>
            如<strong>付款申请单接口</strong>就没有。
          </Text>
        </div>
        <div style={styles.painPointItem}>
          <div style={styles.painPointIcon}><ToolOutlined /></div>
          <Title level={5}>开发复杂</Title>
          <Text type="secondary">
            需要动态脚本处理，<br/>
            配置繁琐，维护成本高。
          </Text>
        </div>
      </div>
    </Card>

    <Card title="本系统解决方案" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
      <Paragraph>
        本系统将复杂的飞书工作流<strong>转换为简单的WebAPI参数填充模式</strong>：
      </Paragraph>
      <ul style={{ lineHeight: 2 }}>
        <li>选择需要的接口，复制对应的表单ID和WebAPI地址</li>
        <li>配置需要查询的飞书字段</li>
        <li>将字段以变量的形式插入到WebAPI中</li>
        <li>系统自动以一条记录为单位进行数据替换和传输</li>
      </ul>
      <Divider style={{ margin: '16px 0' }} />
      <div style={{ textAlign: 'center' }}>
        <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
          速度提升10倍：0.3-0.5秒/条
        </Tag>
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', marginLeft: 8 }}>
          3条并行处理
        </Tag>
      </div>
    </Card>
  </div>
);

// 系统架构
const ArchitectureSection: React.FC = () => (
  <div>
    <Title level={4}>系统架构</Title>
    <Paragraph>
      系统分为<strong>飞书端</strong>和<strong>金蝶端</strong>两个独立模块，通过WebAPI实现数据传输。
    </Paragraph>

    <Card title="飞书端配置" style={{ marginBottom: 16 }}>
      <Paragraph>
        飞书端提供<strong>字段统一处理</strong>功能，让配置变得极其简单：
      </Paragraph>
      <ul style={{ lineHeight: 2 }}>
        <li><strong>自动字段查找</strong>：输入表格参数后，系统自动查找并显示所有字段名称</li>
        <li><strong>下拉选择</strong>：需要作为变量的字段直接下拉选择，<Tag color="red">无需手填，避免打错字</Tag></li>
        <li><strong>统一字段处理</strong>：自动处理字段格式不匹配问题</li>
        <li><strong>筛选条件</strong>：支持设置筛选条件，只同步需要的数据</li>
      </ul>
    </Card>

    <Card title="金蝶端配置" style={{ marginBottom: 16 }}>
      <Paragraph>
        金蝶端提供<strong>WebAPI参数填充</strong>功能：
      </Paragraph>
      <ul style={{ lineHeight: 2 }}>
        <li><strong>登录参数</strong>：填写金蝶服务器地址、用户名、密码</li>
        <li><strong>WebAPI清单</strong>：填写表单ID和WebAPI地址</li>
        <li><strong>变量插入</strong>：将飞书查询的字段以变量形式插入WebAPI</li>
        <li><strong>自动替换</strong>：系统自动以一条记录为单位，将字段值替换对应的变量</li>
      </ul>
    </Card>

    <Card title="数据流程" style={{ marginBottom: 16 }}>
      <Steps
        direction="vertical"
        current={-1}
        items={[
          {
            title: '飞书数据获取',
            description: '根据配置的筛选条件，从飞书多维表格获取需要同步的记录',
            icon: <CloudSyncOutlined />,
          },
          {
            title: '字段映射处理',
            description: '将飞书字段值映射到配置的WebAPI变量中',
            icon: <DatabaseOutlined />,
          },
          {
            title: '并行调用金蝶API',
            description: '3条并行处理，将数据写入金蝶ERP系统',
            icon: <ThunderboltOutlined />,
          },
          {
            title: '结果回写',
            description: '将同步结果回写到飞书多维表格，标记成功或失败状态',
            icon: <CheckCircleOutlined />,
          },
        ]}
      />
    </Card>

    <Alert
      message="数据安全"
      description="系统采用本地部署，所有配置信息和同步数据都存储在本地服务器，不同账户的数据完全隔离，确保企业数据安全。"
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
          title: '新建任务',
          description: '点击「新建任务」按钮，输入任务名称和描述。',
          icon: <RocketOutlined />,
        },
        {
          title: '配置飞书连接',
          description: '填写飞书应用的 AppID、AppSecret、AppToken 和 TableId。系统会自动查找并显示所有可用字段。',
          icon: <CloudSyncOutlined />,
        },
        {
          title: '选择同步字段',
          description: '从下拉列表中选择需要同步的字段（无需手填，避免打错字）。',
          icon: <ToolOutlined />,
        },
        {
          title: '配置金蝶连接',
          description: '填写金蝶服务器地址、用户名、密码和表单ID。',
          icon: <DatabaseOutlined />,
        },
        {
          title: '配置WebAPI',
          description: '填写WebAPI地址，并将飞书字段变量插入到请求参数中。',
          icon: <ApiOutlined />,
        },
        {
          title: '测试连接',
          description: '使用「测试连接」功能验证配置是否正确。',
          icon: <CheckCircleOutlined />,
        },
        {
          title: '执行同步',
          description: '启用任务并点击「执行」按钮开始数据同步。',
          icon: <ThunderboltOutlined />,
        },
      ]}
    />
  </div>
);

// 最佳实践
const TipsSection: React.FC = () => (
  <div>
    <Title level={4}>最佳实践</Title>

    <Card title="推荐配置：筛选与回写组合拳" style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
      <Paragraph>
        <strong>强烈建议</strong>在飞书配置中，将<strong>筛选条件</strong>和<strong>回写成功记录</strong>设置为同一个字段：
      </Paragraph>
      <ul style={{ lineHeight: 2 }}>
        <li>创建一个字段（如"同步状态"），用于标记记录是否已同步</li>
        <li>筛选条件设置为：同步状态 ≠ "成功"</li>
        <li>回写设置：同步成功后，将同步状态更新为"成功"</li>
      </ul>
      <Divider style={{ margin: '16px 0' }} />
      <Alert
        message="优势"
        description="即使同步过程中断或失败，下次点击执行时，系统会自动过滤掉已成功同步的记录，只处理失败的记录，避免重复同步。"
        type="success"
        showIcon
      />
    </Card>

    <Card title="性能优化建议" style={{ marginBottom: 16 }}>
      <ul style={{ lineHeight: 2 }}>
        <li><strong>合理设置筛选条件</strong>：只同步需要的数据，减少不必要的处理</li>
        <li><strong>批量处理</strong>：系统已内置3条并行处理，无需额外配置</li>
        <li><strong>字段精简</strong>：只选择必要的字段进行同步，提高效率</li>
        <li><strong>定期检查日志</strong>：通过执行监控查看同步日志，及时发现并处理问题</li>
      </ul>
    </Card>

    <Card title="错误处理">
      <ul style={{ lineHeight: 2 }}>
        <li>同步失败时，查看执行日志定位具体错误原因</li>
        <li>使用API调试工具测试金蝶接口是否正常</li>
        <li>检查字段映射是否正确，数据格式是否匹配</li>
        <li>确认必填字段是否都有值</li>
      </ul>
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
              <ul style={{ lineHeight: 2 }}>
                <li>检查 App ID 和 App Secret 是否正确</li>
                <li>确认应用已发布到企业内部</li>
                <li>确认已开通多维表格相关权限</li>
                <li>检查 App Token 和 Table ID 是否正确</li>
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
              <ul style={{ lineHeight: 2 }}>
                <li>检查服务器地址是否正确（包含端口号）</li>
                <li>确认用户名和密码正确</li>
                <li>确认账套ID正确</li>
                <li>检查金蝶WebAPI服务是否正常运行</li>
                <li>确认网络可以访问金蝶服务器</li>
              </ul>
            </div>
          ),
        },
        {
          key: '3',
          label: '数据同步失败怎么办？',
          children: (
            <div>
              <ul style={{ lineHeight: 2 }}>
                <li>查看执行日志，定位具体错误信息</li>
                <li>检查字段映射是否正确</li>
                <li>确认必填字段是否有数据</li>
                <li>使用API调试工具测试接口</li>
                <li>检查数据格式是否匹配（如日期格式、数字精度等）</li>
              </ul>
            </div>
          ),
        },
        {
          key: '4',
          label: '如何避免重复同步？',
          children: (
            <div>
              <Paragraph>
                建议使用"筛选与回写组合拳"：
              </Paragraph>
              <ul style={{ lineHeight: 2 }}>
                <li>在飞书多维表格中创建一个"同步状态"字段</li>
                <li>筛选条件设置为：同步状态 ≠ "成功"</li>
                <li>配置回写：同步成功后将状态更新为"成功"</li>
                <li>这样每次执行都会自动跳过已成功的记录</li>
              </ul>
            </div>
          ),
        },
        {
          key: '5',
          label: '支持哪些金蝶接口？',
          children: (
            <div>
              <Paragraph>
                本系统通过WebAPI方式对接金蝶，理论上支持金蝶WebAPI提供的所有接口，
                包括一些飞书集成工作流不支持的接口（如付款申请单）。
              </Paragraph>
              <Paragraph>
                只需要填写正确的表单ID和WebAPI地址即可。
              </Paragraph>
            </div>
          ),
        },
        {
          key: '6',
          label: '数据存储在哪里？安全吗？',
          children: (
            <div>
              <Paragraph>
                <strong>所有数据都存储在您的本地服务器</strong>，不涉及云端存储。
              </Paragraph>
              <ul style={{ lineHeight: 2 }}>
                <li>每个账户的数据完全独立隔离</li>
                <li>配置信息加密存储</li>
                <li>同步日志仅保存在本地</li>
                <li>您可以随时删除数据，完全掌控</li>
              </ul>
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
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
  painPointGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  painPointItem: {
    textAlign: 'center',
    padding: 20,
    background: '#fafafa',
    borderRadius: 8,
  },
  painPointIcon: {
    width: 48,
    height: 48,
    background: '#fff1f0',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    color: '#ff4d4f',
    margin: '0 auto 12px',
  },
};

export default HelpPage;