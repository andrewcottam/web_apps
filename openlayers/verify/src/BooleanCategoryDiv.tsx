import React from 'react';

type Props = {
  data: Record<string, any>;
  use_prop: string;     // The key to extract from the data
  prop_name: string;    // A human-readable name to display
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Valid':
      return 'green';
    case 'Invalid':
      return 'red';
    default:
      return 'gray';
  }
};

// Optional: format the label like "Prop Name"
const formatKey = (key: string): string => {
  return key
    .replace(/_/g, " ")
    .replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
};

const BooleanCategoryDiv: React.FC<Props> = ({ data, use_prop, prop_name }) => {
  const rawValue = data[use_prop];
  const isValid = Boolean(rawValue);

  const category = isValid ? 'Valid' : 'Invalid';
  const backgroundColor = getCategoryColor(category);

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
                {category}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BooleanCategoryDiv;
