// Component that shows a coloured div according to if a value is valid, needs review or invalid. This depends on the passed thresholds.

import React from 'react';
type Thresholds = {
  validMax: number;
  needsReviewMax: number;
};

type Props = {
  data: Record<string, any>;      // JSON object containing the value
  use_prop: string;               // Name of the property to use as binStart
  thresholds: Thresholds;         // Thresholds for the valid, needs review and invalid categories
};

const classify_value = (
  value: number,
  thresholds: Thresholds
): 'Valid' | 'Needs Review' | 'Invalid' => {
  if (value <= thresholds.validMax) return 'Valid';
  if (value <= thresholds.needsReviewMax) return 'Needs Review';
  return 'Invalid';
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Valid':
      return 'green';
    case 'Needs Review':
      return 'orange';
    case 'Invalid':
      return 'red';
    default:
      return 'gray';
  }
};

const CategoryDiv: React.FC<Props> = ({ data, use_prop, thresholds }) => {
  const value = Number(data[use_prop]);

//   if (isNaN(value)) {
//     return <div style={{ color: 'red' }}>Invalid property: {use_prop}</div>;
//   }

  const category = classify_value(value, thresholds);
  const backgroundColor = getCategoryColor(category);

  return (
    <div
      style={{
        backgroundColor,
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        width: 'fit-content',
        fontWeight: 'bold'
      }}
    >
      {category}
    </div>
  );
};

export default CategoryDiv;
