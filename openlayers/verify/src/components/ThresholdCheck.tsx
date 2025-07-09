import React, { useEffect, useRef } from 'react';
import { CheckStatus } from "../types/Enums";
// This component expects a set of values, a use_prop and a single threshold to render the data as valid or invalid

type Props = {
  data: Record<string, any>;
  use_prop: string;
  prop_name: string;
  threshold: number;
  above?: boolean;
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

const ThresholdCheck: React.FC<Props> = ({
  data,
  use_prop,
  prop_name,
  threshold,
  above = true,
  onCheckResult
}) => {
  const value = parseFloat(data[use_prop]);
  const isValid = !isNaN(value)
    ? (above ? value >= threshold : value < threshold)
    : true;

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
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontWeight: 'normal',
                  width: 'fit-content'
                }}
                title={`${use_prop} ${isValid ? '' : ' is not '} ${above ? '>' : '<'} ${threshold}% of the site`}
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

export default ThresholdCheck;
