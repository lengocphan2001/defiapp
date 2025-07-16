import React, { useState } from 'react';
import './SessionTab.css';

const SessionTab: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const sessions = [
    {
      id: 1,
      type: 'buy',
      token: 'BTC',
      amount: '0.5',
      price: '$45,230',
      status: 'completed',
      time: '2 giờ trước',
      profit: '+$1,250'
    },
    {
      id: 2,
      type: 'sell',
      token: 'ETH',
      amount: '2.1',
      price: '$3,240',
      status: 'pending',
      time: '4 giờ trước',
      profit: '-$320'
    },
    {
      id: 3,
      type: 'buy',
      token: 'ADA',
      amount: '1000',
      price: '$0.45',
      status: 'completed',
      time: '1 ngày trước',
      profit: '+$180'
    },
    {
      id: 4,
      type: 'sell',
      token: 'DOT',
      amount: '50',
      price: '$7.80',
      status: 'cancelled',
      time: '2 ngày trước',
      profit: '-$45'
    }
  ];

  const stats = [
    { label: 'Tổng giao dịch', value: '156', change: '+12%' },
    { label: 'Thành công', value: '142', change: '+8%' },
    { label: 'Đang chờ', value: '8', change: '-2%' },
    { label: 'Lợi nhuận', value: '$8,450', change: '+15%' }
  ];

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'buy', label: 'Mua' },
    { id: 'sell', label: 'Bán' },
    { id: 'pending', label: 'Đang chờ' }
  ];

  const filteredSessions = sessions.filter(session => 
    activeFilter === 'all' || session.type === activeFilter || session.status === activeFilter
  );

  return (
    <div className="session-tab">
      {/* Header Stats */}
      <div className="session-header">
        <h2>Phiên giao dịch</h2>

      </div>
    </div>
  );
};

export default SessionTab; 