import React, { useEffect, useRef } from 'react';
import { CheckStatus } from "../types/Enums";

type Thresholds = {
  validMax: number;
  needsReviewMax: number;
};

type Props = {
  data: Record<string, any>;
  use_prop: string;
  prop_name: string;
  thresholds: Thresholds;
  onCheckResult?: (key: string, status: CheckStatus) => void;
};

const classify_value = (
  value: number,
  thresholds: Thresholds
): CheckStatus => {
  if (value <= thresholds.validMax) return CheckStatus.Valid;
  if (value <= thresholds.needsReviewMax) return CheckStatus.NeedsReview;
  return CheckStatus.Invalid;
};

const getCategoryColor = (category: CheckStatus): string => {
  switch (category) {
    case CheckStatus.Valid:
      return 'green';
    case CheckStatus.NeedsReview:
      return 'orange';
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

const ClassificationCheck: React.FC<Props> = ({
  data,
  use_prop,
  prop_name,
  thresholds,
  onCheckResult
}) => {
  const value = Number(data[use_prop]);
  const status = classify_value(value, thresholds);

  const prevStatusRef = useRef<CheckStatus | null>(null);

  useEffect(() => {
    if (onCheckResult && prevStatusRef.current !== status) {
      onCheckResult(use_prop, status);
      prevStatusRef.current = status;
    }
  }, [onCheckResult, use_prop, status]);

  if (isNaN(value)) return null;

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
            <td style={{ padding: '2px 4px' }}>
              <div
                style={{
                  backgroundColor,
                  color: 'white',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontWeight: 'normal',
                  width: 'fit-content'
                }}
                title={use_prop + '=' + value.toString()}
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

export default ClassificationCheck;
