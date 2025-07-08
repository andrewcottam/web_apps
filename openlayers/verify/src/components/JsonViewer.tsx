import React from "react";
import '../index.css';
interface JsonViewerProps {
  data: Record<string, any>;
}

// Helper function to format keys
const formatKey = (key: string): string => {
  return key
    .replace(/_/g, " ")                    // Replace underscores with spaces
    .replace(/\w\S*/g, w =>                // Capitalize each word
      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
};

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  return (
    <div className="json-viewer">
      <table>
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key}>
              <th>{formatKey(key)}</th>
              <td>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JsonViewer;
