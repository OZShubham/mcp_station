 
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DownloadIcon, DocumentTextIcon, CopyIcon, CheckCircleIcon, TableIcon, ChevronDownIcon, XIcon } from './icons.tsx';
import type { Artifact, TestCase, ProjectPlanArtifact, TestCaseArtifact } from './types.ts';
import TableView from './TableView.tsx';
 
// --- Helper Functions for Data Conversion ---
const toCSV = (headers: string[], rows: (string | number | string[])[][]): string => {
    const escapeCell = (cell: any) => {
        const str = Array.isArray(cell) ? cell.join('; ') : String(cell);
        return `"${str.replace(/"/g, '""')}"`;
    };
    const headerRow = headers.map(escapeCell).join(',');
    const contentRows = rows.map(row => row.map(escapeCell).join(',')).join('\n');
    return `${headerRow}\n${contentRows}`;
};
 
const toDOC = (title: string, htmlContent: string): string => {
    return `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${title}</title></head>
        <body><h1>${title}</h1>${htmlContent}</body>
        </html>
    `;
};
 
const getTableHtml = (headers: string[], rows: (string | number | string[])[][]): string => {
    const headerHtml = `<thead><tr>${headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${h}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="border: 1px solid #ddd; padding: 8px;">${Array.isArray(cell) ? cell.join(', ') : cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">${headerHtml}${bodyHtml}</table>`;
};
 
 
// --- Document View Components ---
const TestCaseCard: React.FC<{ testCase: TestCase }> = ({ testCase }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(testCase, null, 2)).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden transition-shadow hover:shadow-md">
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{testCase.id}: {testCase.description}</h4>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                    <CopyIcon />
                    {isCopied ? 'Copied!' : 'Copy JSON'}
                </button>
            </div>
            <div className="p-4 text-sm">
                <div className="mb-3"><p className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Steps:</p><ol className="list-decimal list-inside text-zinc-700 dark:text-zinc-400 space-y-1">{testCase.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></div>
                <div><p className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Expected Result:</p><p className="text-zinc-700 dark:text-zinc-400">{testCase.expectedResult}</p></div>
            </div>
        </div>
    );
};
 
const TestCasesDisplay: React.FC<{ artifact: TestCaseArtifact }> = ({ artifact }) => (
    <div className="p-4 sm:p-6 space-y-4">{artifact.testCases.map(tc => <TestCaseCard key={tc.id} testCase={tc} />)}</div>
);
 
const ProjectPlanDisplay: React.FC<{ artifact: ProjectPlanArtifact }> = ({ artifact }) => (
    <div className="p-4 sm:p-6">
        <div className="mb-6"><h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Objective</h4><p className="text-zinc-600 dark:text-zinc-400 text-sm">{artifact.objective}</p></div>
        <div><h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Tasks</h4><div className="space-y-3">{artifact.tasks.map(task => (<div key={task.id} className="flex items-start gap-3"><CheckCircleIcon className="mt-1 flex-shrink-0 text-zinc-400" /><div className="flex-grow"><p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{task.taskName}</p><p className="text-xs text-zinc-500 dark:text-zinc-400">{task.description}</p></div><span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">{task.dueDate}</span></div>))}</div></div>
    </div>
);
 
// --- Download Dropdown ---
const DownloadDropdown: React.FC<{ onSelect: (format: string) => void; formats: { key: string; label: string }[] }> = ({ onSelect, formats }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
 
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
 
    return (
        <div ref={dropdownRef} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                <DownloadIcon /> Download <ChevronDownIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-10 animate-fadeInUp" style={{animationDuration: '0.2s'}}>
                    {formats.map(({ key, label }) => (
                        <a key={key} href="#" onClick={(e) => { e.preventDefault(); onSelect(key); setIsOpen(false); }} className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300">{label}</a>
                    ))}
                </div>
            )}
        </div>
    );
};
 
// --- Main Artifact Modal ---
interface ArtifactModalProps {
    artifact: Artifact;
    onClose: () => void;
}
 
const ArtifactModal: React.FC<ArtifactModalProps> = ({ artifact, onClose }) => {
    const [viewMode, setViewMode] = useState<'document' | 'table'>('document');
   
    const { headers, rows, downloadFormats } = useMemo(() => {
        let headers: string[] = [];
        let rows: (string | number | string[])[][] = [];
        let downloadFormats: { key: string; label: string }[] = [];
 
        if (artifact.artifactType === 'testCases') {
            headers = ['ID', 'Description', 'Steps', 'Expected Result'];
            rows = artifact.testCases.map(tc => [tc.id, tc.description, tc.steps, tc.expectedResult]);
            downloadFormats = [{ key: 'json', label: 'JSON' }, { key: 'csv', label: 'CSV' }, { key: 'doc', label: 'DOC' }];
        } else if (artifact.artifactType === 'projectPlan') {
            headers = ['ID', 'Task Name', 'Description', 'Due Date'];
            rows = artifact.tasks.map(t => [t.id, t.taskName, t.description, t.dueDate]);
            downloadFormats = [{ key: 'md', label: 'Markdown' }, { key: 'csv', label: 'CSV' }, { key: 'doc', label: 'DOC' }];
        }
        return { headers, rows, downloadFormats };
    }, [artifact]);
 
    const handleDownload = (format: string) => {
        let content: string;
        let mimeType: string;
        const safeFilename = artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'artifact';
 
        switch (format) {
            case 'json': content = JSON.stringify(artifact, null, 2); mimeType = 'application/json'; break;
            case 'csv': content = toCSV(headers, rows); mimeType = 'text/csv'; break;
            case 'md':
                if (artifact.artifactType === 'projectPlan') {
                    content = `# ${artifact.title}\n\n## Objective\n${artifact.objective}\n\n## Tasks\n` + artifact.tasks.map(t => `- **${t.taskName}** (Due: ${t.dueDate}): ${t.description}`).join('\n');
                } else { content = 'Markdown export not available for this artifact type.'; }
                mimeType = 'text/markdown';
                break;
            case 'doc': content = toDOC(artifact.title, getTableHtml(headers, rows)); mimeType = 'application/msword'; break;
            default: return;
        }
 
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
 
    const renderArtifact = () => {
        if (viewMode === 'table') return <TableView headers={headers} rows={rows} />;
        switch (artifact.artifactType) {
            case 'testCases': return <TestCasesDisplay artifact={artifact} />;
            case 'projectPlan': return <ProjectPlanDisplay artifact={artifact} />;
            default: return null;
        }
    };
 
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp" style={{animationDuration: '0.3s'}}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3"><DocumentTextIcon className="text-zinc-500 dark:text-zinc-400" /><h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{artifact.title}</h3></div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-1 bg-zinc-100 dark:bg-zinc-800" >
                            <button onClick={() => setViewMode('document')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-1.5 ${viewMode === 'document' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white'}`}><DocumentTextIcon /> Document</button>
                            <button onClick={() => setViewMode('table')} className={`px-3 py-1 text-sm rounded-md flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white'}`}><TableIcon /> Table</button>
                        </div>
                        <DownloadDropdown onSelect={handleDownload} formats={downloadFormats} />
                        <button onClick={onClose} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"><XIcon /></button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
                    {renderArtifact()}
                </main>
            </div>
        </div>
    );
};
 
export default ArtifactModal;
 