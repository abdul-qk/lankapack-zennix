import React from 'react';

interface InfoBoxProps {
    label: string;
    value: string | number;
}

const InfoBox: React.FC<InfoBoxProps> = ({ label, value }) => {
    return (
        <div className="mb-4">
            <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
            <div className="text-lg font-semibold">{value || "-"}</div>
        </div>
    );
};

export default InfoBox;