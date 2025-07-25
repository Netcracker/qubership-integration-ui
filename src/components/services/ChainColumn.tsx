import React, { useState } from 'react';
import { Dropdown, Button, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Chain {
  id: string;
  name: string;
}

interface ChainColumnProps {
  chains: Chain[];
}

export const ChainColumn: React.FC<ChainColumnProps> = ({ chains }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!chains || chains.length === 0) {
    return <div style={{ color: '#bbb' }}>No chains</div>;
  }

  const handleMenuClick = (chainId: string) => {
    void navigate(`/chains/${chainId}/graph`);
    setOpen(false);
  };

  const menu = (
    <Menu>
      {chains.map(chain => (
        <Menu.Item key={chain.id} onClick={() => handleMenuClick(chain.id)}>
          {chain.name}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']} open={open} onOpenChange={setOpen}>
      <Button type="link">
        {chains.length > 0
          ? (<>{chains.length} {chains.length === 1 ? 'chain' : 'chains'} <DownOutlined /></>)
          : 'No chains'}
      </Button>
    </Dropdown>
  );
};
