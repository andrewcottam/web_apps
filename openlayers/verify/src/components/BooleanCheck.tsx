import React, { useEffect, useRef } from 'react';
import { CheckStatus } from "../types/Enums";

type Props = {
  data: Record<string, any>;
  use_prop: string;
  prop_name: string;
  onCheckResult?: (key: string, status: CheckStatus) => void;
};

const getCategoryColor = (category: CheckStatus): string => {
  switch (category) {
    case CheckStatus.Valid:
      return 'green';
    case CheckStatus.Invalid:
      return 'red';
    default:
      return 'gray';
  }
};

const formatKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
};

const BooleanCheck: React.FC<Props> = ({ data, use_prop, prop_name, onCheckResult }) => {
  const rawValue = data[use_prop];
  const isValid = Boolean(rawValue);
  const status = isValid ? CheckStatus.Valid : CheckStatus.Invalid;

  const prevStatusRef = useRef<CheckStatus | null>(null);

  useEffect(() => {
    if (onCheckResult && prevStatusRef.current !== status) {
      onCheckResult(use_prop, status);
      prevStatusRef.current = status;
    }
  }, [onCheckResult, use_prop, status]);

  const backgroundColor = getCategoryColor(status);

  return (
    <div className="category-table">
      <table>
        <tbody>
          <tr>
            <th style={{
              backgroundColor: '#f0f0f0',
              padding: '4px 8px',
              textAlign: 'left',
              width: '30%'
            }}>
              {formatKey(prop_name)}
            </th>
            <td style={{ padding: '4px 8px' }}>
              <div
                style={{
                  backgroundColor,
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  width: 'fit-content'
                }}
              >
                {status}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BooleanCheck;
