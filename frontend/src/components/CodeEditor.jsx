import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import { Play, Loader } from 'lucide-react';
import axios from '../config/axios';
import { getSocket } from '../config/socket';



const CodeEditor = ({
  file,
  projectId,
  user,
  setOutput,
  isRunning,
  setIsRunning
}) => {

  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const docRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      providerRef.current?.destroy();
      docRef.current?.destroy();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [file?.name]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    const doc = new Y.Doc();
    docRef.current = doc;
    monaco.editor.setTheme('vs-dark');

    const provider = new WebsocketProvider(
      import.meta.env.VITE_YJS_URL,
      `${projectId}-${file.name}`,
      doc
    );
    providerRef.current = provider;

    const ytext = doc.getText('monaco');
    const binding = new MonacoBinding(ytext, editor.getModel(), new Set(), provider.awareness);

    // Wait for sync before inserting initial content — prevents duplication on refresh
    provider.once('sync', (isSynced) => {
      if (isSynced && ytext.toString() === '' && file.content) {
        ytext.insert(0, file.content);
      }
    });



    // ─── DEBOUNCED AUTOSAVE + notify other users ───
    // Skip changes that originated from the WebSocket provider (remote peers).
    // Local keystrokes have a null or non-provider origin.
    ytext.observe((event, transaction) => {
      if (transaction.origin === provider) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await axios.post('/file/save-content', {
            projectId,
            fileName: file.name,
            content: ytext.toString()
          });
          // Notify all users so their lastEditedBy label updates live
          const socket = getSocket();
          socket.emit('update-file', {
            projectId,
            fileName: file.name,
            content: ytext.toString()
          });
        } catch (err) {
          console.error('Save failed', err);
        }
      }, 2000);
    });
  };

  const handleRunCode = async () => {
    if (!file) return;
    setIsRunning(true);
    setOutput('Running code...\n');
    try {
      const response = await axios.post('/code/execute', {
        code: file.content,
        language: file.language
      });
      if (response.data.success) {
        setOutput(response.data.output || 'No output');
      } else {
        setOutput(`Error: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the file tree or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Editor Header */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white font-medium">{file.name}</span>
          <span className="text-xs text-gray-400 uppercase px-2 py-0.5 bg-white/5 rounded">
            {file.language}
          </span>
          {file.lastEditedBy && (
            <span className="text-xs text-gray-500">
              Last edited by: {file.lastEditedBy.username || 'Unknown'}
            </span>
          )}
        </div>
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition text-sm font-medium"
        >
          {isRunning ? (
            <>
              <Loader size={16} className="animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Code
            </>
          )}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={file.language}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;