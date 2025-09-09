import React, { useEffect, useState, useRef } from "react";
import { Modal, Form, Input, Badge, Button, Switch, Select } from "antd";
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { EntityLabels } from '../labels/EntityLabels';
import { Environment, EnvironmentRequest } from '../../api/apiTypes';
import { useServiceContext } from './ServiceParametersPage';
import { Segmented } from 'antd';
import { EnvironmentSourceType } from '../../api/apiTypes';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface EnvironmentParamsModalProps {
  open: boolean;
  environment: Environment | null;
  onClose: () => void;
  onSave: (envRequest: EnvironmentRequest) => Promise<void>;
  saving: boolean;
}

export const EnvironmentParamsModal: React.FC<EnvironmentParamsModalProps> = ({
                                                                                open,
                                                                                environment,
                                                                                onClose,
                                                                                onSave,
                                                                                saving,
                                                                              }) => {
  const [form] = Form.useForm();
  const [showProperties, setShowProperties] = useState(false);
  const [showAsKeyValue, setShowAsKeyValue] = useState(false);
  const [propertiesObj, setPropertiesObj] = useState<Record<string, string>>({});
  const [propertiesText, setPropertiesText] = useState<string>('');
  const [addingRows, setAddingRows] = useState<Array<{ key: string; value: string; id: string }>>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const keyInputRefs = useRef<{ [id: string]: HTMLInputElement | import('antd').InputRef | null }>({});
  const valueInputRefs = useRef<{ [key: string]: HTMLInputElement | import('antd').InputRef | null }>({});
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [editingValueKey, setEditingValueKey] = useState<string | null>(null);
  const [hoverValueKey, setHoverValueKey] = useState<string | null>(null);

  const [currentSourceType, setCurrentSourceType] = useState<EnvironmentSourceType>(environment?.sourceType || EnvironmentSourceType.MANUAL);
  const system = useServiceContext();
  const protocol = system?.protocol || '';


  useEffect(() => {
    if (!isEditingText) {
      setPropertiesText(
        Object.entries(propertiesObj)
          .map(([key, value]) => `${key}=${value};`)
          .join('\n')
      );
    }
  }, [propertiesObj, isEditingText]);

  useEffect(() => {
    if (open && environment) {
      form.setFieldsValue({
        name: environment.name,
        address: environment.address,
        sourceType: environment.sourceType,
        labels: environment.labels,
      });
      setPropertiesObj(
        Object.fromEntries(
          Object.entries(environment.properties || {}).map(([k, v]) => [k, String(v)])
        )
      );
      setAddingRows([]);
      setCurrentSourceType(environment.sourceType || EnvironmentSourceType.MANUAL);
    } else if (!open) {
      setPropertiesObj({});
      setPropertiesText('');
      setAddingRows([]);
    }
  }, [open, environment?.id, environment, form]);

  useEffect(() => {
    setCurrentSourceType(environment?.sourceType || EnvironmentSourceType.MANUAL);
  }, [environment?.sourceType, open]);

  useEffect(() => {
    if (focusRowId && keyInputRefs.current[focusRowId]) {
      keyInputRefs.current[focusRowId]?.focus();
      setFocusRowId(null);
    }
  }, [addingRows, focusRowId]);

  useEffect(() => {
    if (editingValueKey && valueInputRefs.current[editingValueKey]) {
      valueInputRefs.current[editingValueKey]?.focus();
    }
  }, [editingValueKey]);

  const handleAddRow = (record: { key: string; value: string; id: string }) => {
    if (!record.key || !record.value) return;
    setPropertiesObj(prev => ({ ...prev, [record.key]: record.value }));
    const newId = Math.random().toString(36).slice(2);
    setAddingRows(rows => rows.filter(r => r.id !== record.id).concat({ key: '', value: '', id: newId }));
    setFocusRowId(newId);
  };

  const handleSave = () => {
    void (async () => {
      try {
        const values = (await form.validateFields()) as {
          name: string;
          address?: string;
          labels?: string[];
          sourceType?: EnvironmentSourceType;
        };
        const draftProps = Object.fromEntries(
          addingRows.filter(r => r.key && r.value).map(r => [r.key, r.value])
        );
        const mergedProps = { ...propertiesObj, ...draftProps };
        const envRequest: EnvironmentRequest = {
          name: values.name,
          address: currentSourceType !== EnvironmentSourceType.MAAS && currentSourceType !== EnvironmentSourceType.MAAS_BY_CLASSIFIER ? values.address : undefined,
          labels: values.labels?.map(l => ({ name: l, technical: false })),
          properties: mergedProps,
          sourceType: currentSourceType,
        };
        await onSave(envRequest);
        setPropertiesObj({});
        setAddingRows([]);
        onClose();
      } catch {
        // do nothing
      }
    })();
  };

  const cellStyle = { border: '1px solid #eee', padding: 4 };
  const iconBtnStyle = {
    width: 28,
    height: 28,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const propertiesTableTransition = {
    transition: 'max-height 0.35s ease, opacity 0.35s ease',
    overflow: 'hidden',
    opacity: 1,
    maxHeight: 1000,
  };

  const propertiesTableHidden = {
    ...propertiesTableTransition,
    opacity: 0,
    maxHeight: 0,
    pointerEvents: 'none',
  };

  return (
    <Modal
      open={open}
      title="Edit Environment"
      onCancel={onClose}
      onOk={handleSave}
      okText="Save"
      cancelText="Cancel"
      width={900}
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical">
        {environment?.labels && environment?.labels?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <EntityLabels labels={environment.labels.map(l => ({ name: l.name, technical: false }))} />
          </div>
        )}

        <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Labels" name="labels">
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            options={[
              { value: 'Development' },
              { value: 'Development1' },
              { value: 'Development2' },
              { value: 'QA' },
              { value: 'QA1' },
              { value: 'QA2' },
              { value: 'Production' },
              { value: 'Production1' },
              { value: 'Production2' },
              { value: 'Staging' },
              { value: 'Staging1' },
              { value: 'Staging2' },
              { value: 'SVT' },
              { value: 'SVT1' },
              { value: 'SVT2' },
            ]}
            placeholder="Select environment labels"
          />
        </Form.Item>

        <Form.Item label="Source type" name="sourceType">
          <Segmented
            options={[
              { label: 'Manual', value: EnvironmentSourceType.MANUAL },
              { label: 'MaaS', value: EnvironmentSourceType.MAAS_BY_CLASSIFIER },
            ]}
            value={currentSourceType}
            onChange={val => {
              setCurrentSourceType(val as EnvironmentSourceType);
              form.setFieldValue('sourceType', val);
            }}
            disabled={!(protocol && ['KAFKA', 'AMQP', 'RABBIT'].includes(protocol.toUpperCase()))}
            style={{ minWidth: 120, width: 'auto' }}
          />
          {(currentSourceType === EnvironmentSourceType.MAAS || currentSourceType === EnvironmentSourceType.MAAS_BY_CLASSIFIER) && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, color: '#888' }}>
              <QuestionCircleOutlined style={{ marginRight: 8, fontSize: 18 }} />
              <span>This type allows the use of the MaaS classifier to obtain connection parameters when creating a chain snapshot.</span>
            </div>
          )}
        </Form.Item>

        <div
          style={{
            transition: 'max-height 0.3s, opacity 0.3s',
            maxHeight: (currentSourceType !== EnvironmentSourceType.MAAS && currentSourceType !== EnvironmentSourceType.MAAS_BY_CLASSIFIER) ? 100 : 0,
            opacity: (currentSourceType !== EnvironmentSourceType.MAAS && currentSourceType !== EnvironmentSourceType.MAAS_BY_CLASSIFIER) ? 1 : 0,
            overflow: 'hidden',
            pointerEvents: (currentSourceType !== EnvironmentSourceType.MAAS && currentSourceType !== EnvironmentSourceType.MAAS_BY_CLASSIFIER) ? 'auto' : 'none',
          }}
        >
          <Form.Item
            label="Address"
            name="address"
            rules={currentSourceType === EnvironmentSourceType.MANUAL ? [{ required: true, message: 'Address is required' }] : []}
          >
            <Input />
          </Form.Item>
        </div>

        {environment?.properties && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
              <span
                style={{ marginRight: 8, fontSize: 16, color: '#888', cursor: 'pointer' }}
                onClick={() => setShowProperties(prev => !prev)}
              >
                {showProperties ? '▲' : '▼'}
              </span>
              <b>Properties</b>
              <Badge count={Object.keys(propertiesObj).length} style={{ backgroundColor: '#1677ff', marginLeft: 8 }} />
              {showProperties && (
                <>
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    style={{ marginLeft: 16 }}
                    onClick={() => {
                      const newId = Math.random().toString(36).slice(2);
                      setAddingRows(rows => [...rows, { key: '', value: '', id: newId }]);
                      setFocusRowId(newId);
                    }}
                  />
                  <Switch
                    checked={showAsKeyValue}
                    onChange={setShowAsKeyValue}
                    style={{ marginLeft: 16 }}
                    size="small"
                  />
                  <span style={{ marginLeft: 8 }}>Show as Key Value</span>
                </>
              )}
            </div>

            <div style={showProperties ? propertiesTableTransition : propertiesTableHidden}>
              {showAsKeyValue ? (
                <Input.TextArea
                  value={propertiesText}
                  onChange={e => {
                    const lines = e.target.value.split('\n');
                    const obj: Record<string, string> = {};
                    lines.forEach(line => {
                      const match = line.match(/^\s*([^=;\s]+)\s*=\s*([^;]*);?\s*$/);
                      if (match) obj[match[1]] = match[2];
                    });
                    setPropertiesObj(obj);
                    setPropertiesText(e.target.value);
                  }}
                  onFocus={() => setIsEditingText(true)}
                  onBlur={() => setIsEditingText(false)}
                  autoSize={{ minRows: 6, maxRows: 16 }}
                  style={{ fontFamily: 'monospace', marginTop: 8, background: '#fafafa' }}
                />
              ) : (
                <Form.Item style={{ margin: 0 }}>
                  <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse' }}>
                    <thead>
                    <tr>
                      <th style={{ ...cellStyle, width: '35%' }}>Key</th>
                      <th style={{ ...cellStyle, width: '60%' }}>Value</th>
                      <th style={{ ...cellStyle, width: '5%' }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {Object.entries(propertiesObj).map(([key, value]) => (
                      <tr key={key}>
                        <td style={cellStyle}>{key}</td>
                        <td style={cellStyle}>
                          {editingValueKey === key ? (
                            <Input
                              ref={el => el && (valueInputRefs.current[key] = el)}
                              defaultValue={value}
                              onBlur={e => {
                                setPropertiesObj(prev => ({ ...prev, [key]: e.target.value }));
                                setEditingValueKey(null);
                              }}
                              onPressEnter={e => {
                                setPropertiesObj(prev => ({ ...prev, [key]: (e.target as HTMLInputElement).value }));
                                setEditingValueKey(null);
                              }}
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <div
                              style={{ display: 'flex', alignItems: 'center', minHeight: 32, cursor: 'pointer' }}
                              onMouseEnter={() => setHoverValueKey(key)}
                              onMouseLeave={() => setHoverValueKey(null)}
                              onClick={() => setEditingValueKey(key)}
                            >
                              <span style={{ flex: 1 }}>{value}</span>
                              {hoverValueKey === key && <EditOutlined style={{ marginLeft: 8, color: '#888' }} />}
                            </div>
                          )}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            style={iconBtnStyle}
                            onClick={() => {
                              setPropertiesObj(prev => {
                                const copy = { ...prev };
                                delete copy[key];
                                return copy;
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                    {addingRows.map(record => (
                      <tr key={record.id}>
                        <td style={cellStyle}>
                          <Input
                            ref={el => el && (keyInputRefs.current[record.id] = el)}
                            value={record.key}
                            onChange={e => {
                              setAddingRows(rows => rows.map(r => r.id === record.id ? { ...r, key: e.target.value } : r));
                            }}
                            onPressEnter={() => handleAddRow(record)}
                            style={{ minWidth: 80 }}
                          />
                        </td>
                        <td style={cellStyle}>
                          <Input
                            value={record.value}
                            onChange={e => {
                              setAddingRows(rows => rows.map(r => r.id === record.id ? { ...r, value: e.target.value } : r));
                            }}
                            onPressEnter={() => handleAddRow(record)}
                            style={{ minWidth: 80 }}
                          />
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            style={iconBtnStyle}
                            onClick={() => {
                              setAddingRows(rows => rows.filter(r => r.id !== record.id));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </Form.Item>
              )}
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};
