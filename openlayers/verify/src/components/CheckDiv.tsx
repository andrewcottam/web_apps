import React from 'react';
import { CheckStatus } from "../types/Enums";
import type { Check } from '../types/Check';
// This component expects an object with the following props: name, status, status_message, thresholds and value

type Props = {
  check: Check;
  onCheckResult?: (key: string, status: CheckStatus) => void;
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

const CheckDiv: React.FC<Props> = ({ check }) => {
  const backgroundColor = getCategoryColor(check.status);

  return (
    <div className="category-table" id={check.name}>
      <table>
        <tbody>
          <tr>
            <th>
              {formatKey(check.name)}
            </th>
            <td>
              <div
                style={{
                  backgroundColor,
                  marginLeft: 8,
                  color: 'white',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.02em',
                  width: 'fit-content',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
                title={check.status_message}
              >
                {check.status}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};


export default CheckDiv;
