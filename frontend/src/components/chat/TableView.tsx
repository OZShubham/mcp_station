import React from 'react';
 
interface TableViewProps {
    headers: string[];
    rows: (string | number | string[])[][];
}
 
const TableView: React.FC<TableViewProps> = ({ headers, rows }) => {
    return (
        <div className="p-4 sm:p-6">
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                            {headers.map((header, index) => (
                                <th key={index} scope="col" className="px-6 py-4 text-left font-semibold text-zinc-800 dark:text-zinc-200">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-zinc-50/70 dark:hover:bg-white/5">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-6 py-4 text-zinc-700 dark:text-zinc-300 align-top">
                                        {Array.isArray(cell) ? (
                                            <ul className="list-disc list-inside space-y-1">
                                                {cell.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        ) : (
                                            cell
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
 
export default TableView;